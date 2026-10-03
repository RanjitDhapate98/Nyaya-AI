const mongoose = require('mongoose');
const logger = require('../config/logger');
const env = require('../config/env');

// Centralised error handler -> { success:false, message, error }
// eslint-disable-next-line no-unused-vars
module.exports = function errorMiddleware(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let error = err.error;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Database validation failed';
    error = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
    error = { field };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  } else if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    status = 503;
    message = 'Database unavailable';
  }

  if (status >= 500) logger.error(`${req.method} ${req.originalUrl} -> ${status}: ${err.stack || err.message}`);
  else logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${message}`);

  const body = { success: false, message };
  if (error !== undefined) body.error = error;
  else if (status >= 500) body.error = env.isProduction ? 'INTERNAL_ERROR' : err.name;
  res.status(status).json(body);
};
