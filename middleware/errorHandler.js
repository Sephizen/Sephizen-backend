import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, _req, res, _next) {
  const isMulterFileSize = err?.code === 'LIMIT_FILE_SIZE';
  const isZodValidation = err instanceof ZodError;

  const status = isMulterFileSize ? 413 : isZodValidation ? 400 : (err.statusCode || err.status || 500);
  const message = isZodValidation
    ? err.issues.map((issue) => issue.message).join(', ')
    : err.message || 'Internal server error';

  if (status >= 500) {
    logger.error({
      message,
      stack: err.stack
    });
  }

  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : message
  });
}
