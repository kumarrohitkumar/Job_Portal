import { AppError } from '../lib/errors.js';

export function notFoundRoute(req, _res, next) {
  next(new AppError(404, `No route for ${req.method} ${req.path}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) return res.status(err.status).json({ success: false, message: err.message, ...(err.errors && { errors: err.errors }) });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  if (err?.code === 11000) return res.status(409).json({ success: false, message: 'That already exists' });
  console.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again' });
}
