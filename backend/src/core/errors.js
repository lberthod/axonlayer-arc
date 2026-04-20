/**
 * Standardised HTTP error + global error handler.
 *
 * All API errors returned to clients look like:
 *   { error: { code, message, requestId, details? } }
 */

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code, message, details) => new ApiError(400, code, message, details);
export const unauthorized = (message = 'authentication required') =>
  new ApiError(401, 'unauthorized', message);
export const forbidden = (message = 'forbidden') => new ApiError(403, 'forbidden', message);
export const notFound = (message = 'not found') => new ApiError(404, 'not_found', message);
export const conflict = (code, message, details) => new ApiError(409, code, message, details);
export const tooMany = (message = 'too many requests') =>
  new ApiError(429, 'rate_limited', message);

export function errorHandler(logger) {
  return (err, req, res, _next) => {
    const requestId = req.id || req.headers['x-request-id'] || null;

    if (err instanceof ApiError) {
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          requestId,
          ...(err.details ? { details: err.details } : {})
        }
      });
    }

    // Zod validation error (duck-typed so zod stays optional at load time)
    if (err?.name === 'ZodError' && Array.isArray(err.issues)) {
      return res.status(400).json({
        error: {
          code: 'validation_failed',
          message: 'request body is invalid',
          requestId,
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
        }
      });
    }

    (logger?.error || console.error).call(
      logger || console,
      { err, requestId, url: req.originalUrl },
      'unhandled error'
    );

    res.status(500).json({
      error: {
        code: 'internal_error',
        message: 'internal server error',
        requestId
      }
    });
  };
}

export function notFoundHandler() {
  return (req, res) => {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: `route ${req.method} ${req.originalUrl} not found`,
        requestId: req.id || null
      }
    });
  };
}
