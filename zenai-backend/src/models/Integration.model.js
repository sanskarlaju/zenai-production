// src/models/Integration.model.js
const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['slack', 'notion', 'github', 'jira', 'trello', 'calendar', 'email'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  config: {
    // Slack
    webhookUrl: String,
    channel: String,
    botToken: String,
    
    // Notion
    apiKey: String,
    databaseId: String,
    workspaceId: String,
    
    // GitHub
    token: String,
    repository: String,
    owner: String,
    
    // Jira
    apiToken: String,
    domain: String,
    email: String,
    projectKey: String,
    
    // Trello
    apiKey: String,
    token: String,
    boardId: String,
    
    // Calendar
    serviceAccountKey: String,
    calendarId: String,
    
    // Email
    host: String,
    port: Number,
    secure: Boolean,
    username: String,
    password: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  },
  lastSync: Date,
  syncFrequency: {
    type: String,
    enum: ['realtime', 'hourly', 'daily', 'manual'],
    default: 'manual'
  },
  settings: {
    autoSync: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    },
    bidirectionalSync: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    lastError: String,
    totalSyncs: {
      type: Number,
      default: 0
    },
    successfulSyncs: {
      type: Number,
      default: 0
    },
    failedSyncs: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for quick lookups
integrationSchema.index({ user: 1, type: 1 });
integrationSchema.index({ status: 1 });

// Encrypt sensitive data before saving
integrationSchema.pre('save', function(next) {
  // In production, encrypt sensitive fields like apiKey, token, etc.
  // using crypto or a library like mongoose-encryption
  next();
});

module.exports = mongoose.model('Integration', integrationSchema);