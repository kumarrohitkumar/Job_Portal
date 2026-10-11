import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';
import { uploads } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { email, fullname, phone } from './auth.routes.js';

const profileSchema = z.object({
  fullname: fullname.optional(),
  email: email.optional(),
  phoneNumber: phone.optional(),
  bio: z.string().trim().max(500).optional(),
  // Multipart forms send skills as "React, Node"; JSON clients may send an array.
  skills: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim()).filter(Boolean).slice(0, 30))
    .optional(),
});

export function userRoutes({ jwtSecret, storage, serialize }) {
  const router = Router();

  router.patch('/me', authenticate(jwtSecret), uploads({ resume: 'pdf', photo: 'image' }), validate(profileSchema), async (req, res) => {
    const user = req.user;
    const { bio, skills, ...rest } = req.body;
    if (rest.email && rest.email !== user.email && (await User.exists({ email: rest.email }))) throw new AppError(409, 'Another account already uses this email');
    Object.assign(user, rest);
    if (bio !== undefined) user.profile.bio = bio;
    if (skills !== undefined) user.profile.skills = skills;

    const resume = req.files?.resume?.[0];
    const photo = req.files?.photo?.[0];
    const old = [];
    if (resume) {
      old.push(user.profile.resumeKey);
      user.profile.resumeKey = await storage.put('resumes', user.id, resume);
      user.profile.resumeOriginalName = resume.originalname.slice(0, 120);
    }
    if (photo) {
      old.push(user.profile.photoKey);
      user.profile.photoKey = await storage.put('photos', user.id, photo);
    }
    await user.save();
    await Promise.all(old.map((k) => storage.remove(k)));
    res.json({ success: true, message: 'Profile updated', user: await serialize.user(user) });
  });

  return router;
}
