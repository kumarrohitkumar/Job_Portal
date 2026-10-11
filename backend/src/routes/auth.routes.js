import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';

export const email = z.string().trim().toLowerCase().email('Enter a valid email address');
export const phone = z.string().trim().regex(/^\+?\d{10,13}$/, 'Enter a valid phone number (10 to 13 digits)');
export const fullname = z.string().trim().min(2, 'Enter your full name').max(80);

const registerSchema = z.object({
  fullname,
  email,
  phoneNumber: phone,
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['student', 'recruiter'], { errorMap: () => ({ message: 'Choose job seeker or recruiter' }) }),
});
const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function authRoutes({ jwtSecret, secureCookies, serialize }) {
  const router = Router();
  const cookie = { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: '/' };

  function startSession(res, user) {
    const token = jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, { ...cookie, maxAge: WEEK });
  }

  // Ten failed attempts per email and IP per 15 minutes; successful logins don't count.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${String(req.body?.email ?? '').toLowerCase()}`,
    handler: (_req, _res, next) => next(new AppError(429, 'Too many sign-in attempts. Try again in 15 minutes')),
  });

  router.post('/register', validate(registerSchema), async (req, res) => {
    if (await User.exists({ email: req.body.email })) throw new AppError(409, 'An account with this email already exists');
    const user = await User.create({ ...req.body, password: await bcrypt.hash(req.body.password, 10) });
    startSession(res, user);
    res.status(201).json({ success: true, message: `Welcome, ${user.fullname.split(' ')[0]}`, user: await serialize.user(user) });
  });

  router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) throw new AppError(401, 'Email or password is incorrect');
    startSession(res, user);
    res.json({ success: true, message: `Welcome back, ${user.fullname.split(' ')[0]}`, user: await serialize.user(user) });
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie('token', cookie);
    res.json({ success: true, message: 'Signed out' });
  });

  router.get('/me', authenticate(jwtSecret), async (req, res) => {
    res.json({ success: true, user: await serialize.user(req.user) });
  });

  return router;
}
