// An error with an HTTP status code, handled by middleware/errorHandler.js
export default class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
