import { Router } from 'express';
import { z } from 'zod';
import { AppError, notFound } from '../lib/errors.js';
import { objectId } from '../lib/ids.js';
import { escapeRegex } from '../lib/text.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Application } from '../models/Application.js';
import { Job, JOB_TYPES } from '../models/Job.js';
import { ownCompany } from './companies.routes.js';

const requirements = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim()).filter(Boolean).slice(0, 20));

const fields = {
  title: z.string().trim().min(2, 'Enter a job title').max(100),
  description: z.string().trim().min(20, 'Describe the role in at least 20 characters').max(5000),
  requirements,
  salary: z.coerce.number({ invalid_type_error: 'Salary must be a number' }).min(0, 'Salary cannot be negative').max(500),
  experienceLevel: z.coerce.number().int().min(0, 'Experience cannot be negative').max(40),
  location: z.string().trim().min(2, 'Enter a location').max(100),
  jobType: z.enum(JOB_TYPES, { errorMap: () => ({ message: `Job type must be one of: ${JOB_TYPES.join(', ')}` }) }),
  position: z.coerce.number().int().min(1, 'At least one opening').max(1000),
};
const createSchema = z.object({ ...fields, companyId: z.string().min(1, 'Choose a company') });
const updateSchema = z.object(fields).partial();

async function ownJob(id, user) {
  const job = await Job.findOne({ _id: objectId(id, 'Job not found'), createdBy: user._id });
  if (!job) throw notFound('Job not found');
  return job;
}

export function jobRoutes({ jwtSecret, serialize }) {
  const router = Router();
  const signedIn = authenticate(jwtSecret);
  const recruiter = [signedIn, requireRole('recruiter')];

  // Public listing with search and filters, newest first.
  router.get('/', async (req, res) => {
    const filter = {};
    const keyword = String(req.query.keyword ?? '').trim().slice(0, 100);
    if (keyword) {
      const rx = new RegExp(escapeRegex(keyword), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { requirements: rx }];
    }
    const location = String(req.query.location ?? '').trim().slice(0, 100);
    if (location) filter.location = new RegExp(escapeRegex(location), 'i');
    if (JOB_TYPES.includes(req.query.jobType)) filter.jobType = req.query.jobType;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50, 100);

    const [jobs, total] = await Promise.all([Job.find(filter).populate('company').sort({ createdAt: -1, _id: -1 }).limit(limit), Job.countDocuments(filter)]);
    res.json({ success: true, total, jobs: await Promise.all(jobs.map((j) => serialize.job(j))) });
  });

  router.get('/mine', ...recruiter, async (req, res) => {
    const jobs = await Job.find({ createdBy: req.user._id }).populate('company').sort({ createdAt: -1, _id: -1 });
    const counts = await Application.aggregate([{ $match: { job: { $in: jobs.map((j) => j._id) } } }, { $group: { _id: '$job', n: { $sum: 1 } } }]);
    const byJob = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json({ success: true, jobs: await Promise.all(jobs.map((j) => serialize.job(j, { applicantCount: byJob.get(String(j._id)) ?? 0 }))) });
  });

  router.post('/', ...recruiter, validate(createSchema), async (req, res) => {
    const { companyId, ...rest } = req.body;
    const company = await ownCompany(companyId, req.user);
    const job = await Job.create({ ...rest, company: company._id, createdBy: req.user._id });
    await job.populate('company');
    res.status(201).json({ success: true, message: 'Job posted', job: await serialize.job(job, { applicantCount: 0 }) });
  });

  router.get('/:id', authenticate(jwtSecret, { required: false }), async (req, res) => {
    const job = await Job.findById(objectId(req.params.id, 'Job not found')).populate('company');
    if (!job) throw notFound('Job not found');
    const [applicantCount, mine] = await Promise.all([
      Application.countDocuments({ job: job._id }),
      req.user ? Application.findOne({ job: job._id, applicant: req.user._id }) : null,
    ]);
    res.json({ success: true, job: await serialize.job(job, { applicantCount, hasApplied: !!mine, myStatus: mine?.status ?? null }) });
  });

  router.patch('/:id', ...recruiter, validate(updateSchema), async (req, res) => {
    const job = await ownJob(req.params.id, req.user);
    Object.assign(job, req.body);
    await job.save();
    await job.populate('company');
    res.json({ success: true, message: 'Job updated', job: await serialize.job(job) });
  });

  router.delete('/:id', ...recruiter, async (req, res) => {
    const job = await ownJob(req.params.id, req.user);
    await Application.deleteMany({ job: job._id });
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  });

  router.post('/:id/apply', signedIn, requireRole('student'), async (req, res) => {
    const job = await Job.findById(objectId(req.params.id, 'Job not found'));
    if (!job) throw notFound('Job not found');
    try {
      await Application.create({ job: job._id, applicant: req.user._id });
    } catch (err) {
      if (err?.code === 11000) throw new AppError(409, 'You have already applied for this job');
      throw err;
    }
    res.status(201).json({ success: true, message: 'Application sent' });
  });

  router.get('/:id/applicants', ...recruiter, async (req, res) => {
    const job = await ownJob(req.params.id, req.user);
    const applications = await Application.find({ job: job._id }).populate('applicant').sort({ createdAt: -1 });
    await job.populate('company');
    res.json({
      success: true,
      job: await serialize.job(job),
      applications: await Promise.all(applications.filter((a) => a.applicant).map((a) => serialize.application(a, { withApplicant: true }))),
    });
  });

  return router;
}
