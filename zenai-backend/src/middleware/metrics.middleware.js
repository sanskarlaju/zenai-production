// src/middleware/metrics.middleware.js
const { httpRequestDuration, activeConnections } = require('../utils/metrics');

exports.metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    
    activeConnections.dec();
  });
  
  next();
};

// Metrics endpoint
exports.getMetrics = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};