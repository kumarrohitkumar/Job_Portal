import jwt from 'jsonwebtoken';
import { AppError } from '../lib/errors.js';
import { User } from '../models/User.js';

/** Reads the session cookie (or a Bearer token) and loads the user. `required: false` lets guests through. */
export function authenticate(jwtSecret, { required = true } = {}) {
  return async (req, _res, next) => {
    const header = req.get('authorization');
    const token = req.cookies?.token || (header?.startsWith('Bearer ') ? header.slice(7) : null);
    if (!token) return required ? next(new AppError(401, 'Please sign in to continue')) : next();
    try {
      const { sub } = jwt.verify(token, jwtSecret);
      req.user = await User.findById(sub);
    } catch {
      req.user = null;
    }
    if (!req.user && required) return next(new AppError(401, 'Your session has expired. Please sign in again'));
    next();
  };
}

export const requireRole = (role) => (req, _res, next) =>
  req.user?.role === role ? next() : next(new AppError(403, role === 'recruiter' ? 'Only recruiters can do this' : 'Only job seekers can do this'));
