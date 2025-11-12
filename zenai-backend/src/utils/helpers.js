// src/utils/helpers.js
const crypto = require('crypto');

exports.generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

exports.hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

exports.formatDate = (date) => {
  return new Date(date).toISOString();
};

exports.paginate = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};

  results.data = data.slice(startIndex, endIndex);
  results.pagination = {
    current: page,
    total: Math.ceil(data.length / limit),
    count: data.length
  };

  return results;
};

exports.sanitizeObject = (obj, allowedFields) => {
  const sanitized = {};
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      sanitized[field] = obj[field];
    }
  });
  return sanitized;
};

exports.isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
