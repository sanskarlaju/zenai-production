// src/middleware/validation.middleware.js
const Joi = require('joi');

const schemas = {
  chat: Joi.object({
    message: Joi.string().required().max(5000),
    context: Joi.object({
      type: Joi.string().valid('task-analysis', 'project-management'),
      projectId: Joi.string().length(24).hex(),
      taskId: Joi.string().length(24).hex()
    })
  }),

  createTask: Joi.object({
    description: Joi.string().required().min(10).max(5000),
    projectId: Joi.string().required().length(24).hex()
  }),

  transcribe: Joi.object({
    title: Joi.string().max(200),
    participants: Joi.array().items(Joi.string())
  })
};

exports.validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return next();
    }

    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};