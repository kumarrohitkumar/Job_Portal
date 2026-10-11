import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../lib/errors.js';
import { objectId } from '../lib/ids.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Application, APPLICATION_STATUSES } from '../models/Application.js';

const statusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES, { errorMap: () => ({ message: 'Status must be pending, accepted or rejected' }) }),
});

export function applicationRoutes({ jwtSecret, serialize }) {
  const router = Router();
  router.use(authenticate(jwtSecret));

  router.get('/mine', requireRole('student'), async (req, res) => {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({ path: 'job', populate: { path: 'company' } })
      .sort({ createdAt: -1, _id: -1 });
    res.json({ success: true, applications: await Promise.all(applications.filter((a) => a.job).map((a) => serialize.application(a, { withJob: true }))) });
  });

  router.patch('/:id/status', requireRole('recruiter'), validate(statusSchema), async (req, res) => {
    const application = await Application.findById(objectId(req.params.id, 'Application not found')).populate('job');
    if (!application?.job || String(application.job.createdBy) !== String(req.user._id)) throw notFound('Application not found');
    application.status = req.body.status;
    await application.save();
    res.json({ success: true, message: `Marked as ${req.body.status}`, application: await serialize.application(application) });
  });

  return router;
}
