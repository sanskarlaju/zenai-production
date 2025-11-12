const logger = require('../utils/logger');

class ContextBuilder {
  constructor() {
    this.contextTypes = {
      PROJECT: 'project',
      TASK: 'task',
      USER: 'user',
      TEAM: 'team',
      GENERAL: 'general'
    };
  }

  buildProjectContext(project, tasks = [], team = []) {
    return {
      type: this.contextTypes.PROJECT,
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        deadline: project.deadline,
        tags: project.tags
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'done').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        list: tasks.map(t => ({
          id: t._id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee?.name
        }))
      },
      team: {
        size: team.length,
        members: team.map(m => ({
          id: m._id,
          name: m.name,
          role: m.role,
          tasksAssigned: tasks.filter(t => 
            t.assignee?._id?.toString() === m._id.toString()
          ).length
        }))
      }
    };
  }

  buildTaskContext(task, relatedTasks = []) {
    return {
      type: this.contextTypes.TASK,
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        actualTime: task.actualTime,
        dueDate: task.dueDate,
        tags: task.tags,
        assignee: task.assignee?.name,
        createdBy: task.createdBy?.name
      },
      related: relatedTasks.map(t => ({
        id: t._id,
        title: t.title,
        relation: t.relation || 'dependency'
      })),
      project: task.project ? {
        id: task.project._id,
        name: task.project.name
      } : null
    };
  }

  buildUserContext(user, preferences = {}) {
    return {
      type: this.contextTypes.USER,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      preferences: {
        language: preferences.language || 'en',
        timezone: preferences.timezone || 'UTC',
        notifications: preferences.notifications || true,
        ...preferences
      }
    };
  }

  buildTeamContext(team, projects = [], tasks = []) {
    return {
      type: this.contextTypes.TEAM,
      team: {
        members: team.map(m => ({
          id: m._id,
          name: m.name,
          role: m.role,
          availability: m.availability || 'available'
        })),
        size: team.length
      },
      workload: {
        activeProjects: projects.length,
        totalTasks: tasks.length,
        avgTasksPerMember: tasks.length / team.length,
        distribution: this.calculateWorkloadDistribution(team, tasks)
      }
    };
  }

  calculateWorkloadDistribution(team, tasks) {
    return team.map(member => ({
      memberId: member._id,
      name: member.name,
      assignedTasks: tasks.filter(t => 
        t.assignee?._id?.toString() === member._id.toString()
      ).length,
      completedTasks: tasks.filter(t => 
        t.assignee?._id?.toString() === member._id.toString() && 
        t.status === 'done'
      ).length
    }));
  }

  mergeContexts(...contexts) {
    return contexts.reduce((merged, ctx) => {
      return { ...merged, ...ctx };
    }, {});
  }

  formatForPrompt(context) {
    const lines = [];
    
    if (context.project) {
      lines.push(`**Project Context:**`);
      lines.push(`- Name: ${context.project.name}`);
      lines.push(`- Status: ${context.project.status}`);
      lines.push(`- Progress: ${context.project.progress}%`);
    }
    
    if (context.tasks) {
      lines.push(`\n**Tasks:**`);
      lines.push(`- Total: ${context.tasks.total}`);
      lines.push(`- Completed: ${context.tasks.completed}`);
      lines.push(`- In Progress: ${context.tasks.inProgress}`);
    }
    
    if (context.team) {
      lines.push(`\n**Team:**`);
      lines.push(`- Size: ${context.team.size}`);
    }
    
    return lines.join('\n');
  }
}

module.exports = ContextBuilder;