// src/controllers/ai.controller.js
const aiService = require('../services/ai.service');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|mp4|webm|ogg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only audio files allowed.'));
  }
});

exports.uploadAudio = upload.single('audio');

// Chat with AI
exports.chat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const result = await aiService.chat(userId, message, context);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Create task from natural language
exports.createTask = async (req, res, next) => {
  try {
    const { description, projectId } = req.body;
    const userId = req.user.userId;

    if (!description || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Description and projectId are required'
      });
    }

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const hasAccess = project.owner.toString() === userId ||
                      project.team.some(t => t.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await aiService.createTaskFromDescription(
      description,
      projectId,
      userId
    );

    // Create actual task in database
    const task = await Task.create({
      ...result.task,
      project: projectId,
      createdBy: userId
    });

    logger.info(`AI created task: ${task._id} for project: ${projectId}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// Analyze task complexity and effort
exports.analyzeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('project');
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

    const projectContext = {
      name: task.project.name,
      status: task.project.status,
      priority: task.project.priority
    };

    const analysis = await aiService.analyzeTask(task, projectContext);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// Analyze project health
exports.analyzeProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const hasAccess = project.owner.toString() === req.user.userId ||
                      project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const tasks = await Task.find({ project: projectId });

    const analysis = await aiService.analyzeProject(project, tasks);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// Transcribe audio/meeting
exports.transcribe = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    const { title, participants } = req.body;
    const audioPath = req.file.path;

    const meetingContext = {
      title: title || 'Team Meeting',
      participants: participants ? JSON.parse(participants) : [],
      date: new Date().toISOString()
    };

    const result = await aiService.transcribeAudio(audioPath, meetingContext);

    // Clean up uploaded file
    fs.unlinkSync(audioPath);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Suggest task breakdown
exports.suggestBreakdown = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtasks = await aiService.suggestTaskBreakdown(task);

    res.json({
      success: true,
      data: subtasks
    });
  } catch (error) {
    next(error);
  }
};

// Estimate effort for multiple tasks
exports.estimateEffort = async (req, res, next) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task IDs array is required'
      });
    }

    const tasks = await Task.find({ _id: { $in: taskIds } });

    const estimates = await aiService.estimateEffort(tasks);

    res.json({
      success: true,
      data: estimates
    });
  } catch (error) {
    next(error);
  }
};

// Get chat history
exports.getChatHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessage.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ChatMessage.countDocuments({ user: userId })
    ]);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Index document for RAG
exports.indexDocument = async (req, res, next) => {
  try {
    const { content, metadata } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await aiService.indexDocument(content, {
      ...metadata,
      userId: req.user.userId,
      indexedAt: new Date()
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Search documents
exports.searchDocuments = async (req, res, next) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await aiService.searchDocuments(query, {
      limit: parseInt(limit),
      filter: { userId: req.user.userId }
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};