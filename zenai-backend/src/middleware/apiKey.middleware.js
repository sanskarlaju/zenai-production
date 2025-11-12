// src/middleware/apiKey.middleware.js
const crypto = require('crypto');
const { cache } = require('../config/redis');

class APIKeyManager {
  static generateAPIKey(userId) {
    const key = `zn_${crypto.randomBytes(32).toString('hex')}`;
    return key;
  }

  static async validateAPIKey(key) {
    // Check cache first
    const cachedUserId = await cache.get(`apikey:${key}`);
    if (cachedUserId) {
      return cachedUserId;
    }

    // Check database
    const apiKey = await APIKey.findOne({ key, isActive: true });
    if (!apiKey) {
      return null;
    }

    // Update last used
    apiKey.lastUsed = new Date();
    await apiKey.save();

    // Cache for 1 hour
    await cache.set(`apikey:${key}`, apiKey.userId, 3600);

    return apiKey.userId;
  }

  static middleware() {
    return async (req, res, next) => {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API key required'
        });
      }

      const userId = await APIKeyManager.validateAPIKey(apiKey);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }

      req.user = { userId };
      next();
    };
  }
}

module.exports = APIKeyManager;