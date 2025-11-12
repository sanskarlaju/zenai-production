// src/controllers/task.controller.js
const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

exports.createTask = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      project, 
      assignee, 
      priority, 
      tags, 
      dueDate,
      estimatedTime,
      dependencies 
    } = req.body;

    // Verify project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const hasAccess = projectDoc.owner.toString() === req.user.userId ||
                      projectDoc.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      project,
      assignee: assignee || null,
      createdBy: req.user.userId,
      priority,
      tags,
      dueDate,
      estimatedTime,
      dependencies
    });

    // Update project metadata
    await Project.findByIdAndUpdate(project, {
      $inc: { 'metadata.totalTasks': 1 }
    });

    // Clear cache
    await cache.clearPattern(`tasks:${project}:*`);
    await cache.clearPattern(`projects:*`);

    // Populate task
    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);

    logger.info(`Task created: ${task._id} in project: ${project}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignee, page = 1, limit = 20 } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Verify access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const hasAccess = project.owner.toString() === req.user.userId ||
                      project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build cache key
    const cacheKey = `tasks:${projectId}:${status || 'all'}:${priority || 'all'}:${assignee || 'all'}:${page}`;
    
    let result = await cache.get(cacheKey);

    if (!result) {
      const query = { project: projectId };
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (assignee) query.assignee = assignee;

      const skip = (page - 1) * limit;

      const [tasks, total] = await Promise.all([
        Task.find(query)
          .populate('assignee', 'name email avatar')
          .populate('createdBy', 'name email avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Task.countDocuments(query)
      ]);

      result = {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

      await cache.set(cacheKey, result, 300);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name owner team')
      .populate('dependencies');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access
    const hasAccess = task.project.owner.toString() === req.user.userId ||
                      task.project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access
    const hasAccess = task.project.owner.toString() === req.user.userId ||
                      task.project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Track status change for project metadata
    const oldStatus = task.status;
    Object.assign(task, updates);
    await task.save();

    // Update project metadata if status changed
    if (oldStatus !== task.status) {
      await updateProjectMetadata(task.project._id);
    }

    // Clear cache
    await cache.clearPattern(`tasks:${task.project._id}:*`);
    await cache.clearPattern(`projects:*`);

    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access (owner or creator can delete)
    const isOwner = task.project.owner.toString() === req.user.userId;
    const isCreator = task.createdBy.toString() === req.user.userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or task creator can delete'
      });
    }

    const projectId = task.project._id;
    await task.deleteOne();

    // Update project metadata
    await Project.findByIdAndUpdate(projectId, {
      $inc: { 'metadata.totalTasks': -1 }
    });

    await updateProjectMetadata(projectId);

    // Clear cache
    await cache.clearPattern(`tasks:${projectId}:*`);
    await cache.clearPattern(`projects:*`);

    logger.info(`Task deleted: ${id} by user: ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const task = await Task.findById(id).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access
    const hasAccess = task.project.owner.toString() === req.user.userId ||
                      task.project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    task.comments.push({
      user: req.user.userId,
      text: text.trim(),
      createdAt: new Date()
    });

    await task.save();
    await task.populate('comments.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: task.comments[task.comments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

exports.addAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url, type, size } = req.body;

    const task = await Task.findById(id).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access
    const hasAccess = task.project.owner.toString() === req.user.userId ||
                      task.project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    task.attachments.push({ name, url, type, size });
    await task.save();

    res.json({
      success: true,
      message: 'Attachment added successfully',
      data: task.attachments[task.attachments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// Helper function
async function updateProjectMetadata(projectId) {
  const tasks = await Task.find({ project: projectId });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  await Project.findByIdAndUpdate(projectId, {
    progress,
    'metadata.totalTasks': totalTasks,
    'metadata.completedTasks': completedTasks,
    'metadata.inProgressTasks': inProgressTasks
  });
}