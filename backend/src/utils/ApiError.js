class ApiError extends Error {
  constructor(statusCode, message, error = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.isOperational = true;
  }

  static badRequest(msg, err) { return new ApiError(400, msg, err); }
  static unauthorized(msg = 'Authentication required') { return new ApiError(401, msg); }
  static forbidden(msg = 'You do not have permission to perform this action') { return new ApiError(403, msg); }
  static notFound(msg = 'Resource not found') { return new ApiError(404, msg); }
  static conflict(msg, err) { return new ApiError(409, msg, err); }
  static unprocessable(msg, err) { return new ApiError(422, msg, err); }
  static unavailable(msg, err) { return new ApiError(503, msg, err); }
}

module.exports = ApiError;
