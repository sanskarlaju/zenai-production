const logger = require('../utils/logger');

class TaskAutomation {
  constructor(options = {}) {
    this.rules = new Map();
    this.triggers = new Map();
    this.actions = new Map();
    
    this.registerDefaultActions();
  }

  registerDefaultActions() {
    this.registerAction('send_notification', async (data) => {
      logger.info('Sending notification:', data);
      // Implement notification logic
    });

    this.registerAction('update_status', async (data) => {
      logger.info('Updating status:', data);
      // Implement status update logic
    });

    this.registerAction('assign_task', async (data) => {
      logger.info('Assigning task:', data);
      // Implement task assignment logic
    });

    this.registerAction('create_subtask', async (data) => {
      logger.info('Creating subtask:', data);
      // Implement subtask creation logic
    });
  }

  registerRule(ruleId, rule) {
    this.rules.set(ruleId, {
      id: ruleId,
      trigger: rule.trigger,
      conditions: rule.conditions || [],
      actions: rule.actions || [],
      enabled: rule.enabled !== false
    });
  }

  registerAction(actionName, handler) {
    this.actions.set(actionName, handler);
  }

  async evaluateTrigger(triggerType, data) {
    try {
      const matchingRules = Array.from(this.rules.values()).filter(
        rule => rule.enabled && rule.trigger.type === triggerType
      );

      for (const rule of matchingRules) {
        const shouldExecute = await this.evaluateConditions(rule.conditions, data);
        
        if (shouldExecute) {
          await this.executeActions(rule.actions, data);
        }
      }
    } catch (error) {
      logger.error('Trigger evaluation error:', error);
      throw error;
    }
  }

  async evaluateConditions(conditions, data) {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, data);
      if (!result) return false;
    }

    return true;
  }

  async evaluateCondition(condition, data) {
    const { field, operator, value } = condition;
    const actualValue = this.getNestedValue(data, field);

    switch (operator) {
      case 'equals':
        return actualValue === value;
      case 'not_equals':
        return actualValue !== value;
      case 'contains':
        return actualValue?.includes(value);
      case 'greater_than':
        return actualValue > value;
      case 'less_than':
        return actualValue < value;
      case 'is_empty':
        return !actualValue || actualValue.length === 0;
      case 'is_not_empty':
        return actualValue && actualValue.length > 0;
      default:
        return false;
    }
  }

  async executeActions(actions, data) {
    for (const action of actions) {
      try {
        const handler = this.actions.get(action.type);
        
        if (handler) {
          await handler({ ...data, ...action.params });
        } else {
          logger.warn(`Action handler not found: ${action.type}`);
        }
      } catch (error) {
        logger.error(`Action execution error (${action.type}):`, error);
      }
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  // Common automation rules
  createTaskCompletionRule() {
    return {
      trigger: { type: 'task.completed' },
      conditions: [],
      actions: [
        {
          type: 'send_notification',
          params: {
            message: 'Task completed!',
            channel: 'slack'
          }
        },
        {
          type: 'update_status',
          params: { status: 'done' }
        }
      ]
    };
  }

  createDeadlineAlertRule() {
    return {
      trigger: { type: 'task.deadline_approaching' },
      conditions: [
        { field: 'status', operator: 'not_equals', value: 'done' },
        { field: 'daysUntilDeadline', operator: 'less_than', value: 3 }
      ],
      actions: [
        {
          type: 'send_notification',
          params: {
            message: 'Deadline approaching!',
            urgency: 'high'
          }
        }
      ]
    };
  }

  createAutoAssignRule() {
    return {
      trigger: { type: 'task.created' },
      conditions: [
        { field: 'assignee', operator: 'is_empty' }
      ],
      actions: [
        {
          type: 'assign_task',
          params: {
            strategy: 'round_robin'
          }
        }
      ]
    };
  }
}

module.exports = TaskAutomation;