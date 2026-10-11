import { AppError } from '../lib/errors.js';

/** Validates req.body against a zod schema and replaces it with the parsed value. */
export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message }));
    return next(new AppError(400, errors[0].message, errors));
  }
  req.body = parsed.data;
  next();
};
