import { Router } from 'express';
import { z } from 'zod';
import { AppError, notFound } from '../lib/errors.js';
import { objectId } from '../lib/ids.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploads } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { Company } from '../models/Company.js';

const name = z.string().trim().min(2, 'Enter the company name').max(80);
const nameKey = (n) => n.trim().toLowerCase().replace(/\s+/g, ' ');
const website = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === '' || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), 'Website must start with http:// or https://');

const updateSchema = z.object({
  name: name.optional(),
  description: z.string().trim().max(2000).optional(),
  website: website.optional(),
  location: z.string().trim().max(100).optional(),
});

export async function ownCompany(id, user) {
  const company = await Company.findOne({ _id: objectId(id, 'Company not found'), owner: user._id });
  if (!company) throw notFound('Company not found');
  return company;
}

export function companyRoutes({ jwtSecret, storage, serialize }) {
  const router = Router();
  router.use(authenticate(jwtSecret), requireRole('recruiter'));

  router.post('/', validate(z.object({ name })), async (req, res) => {
    if (await Company.exists({ nameKey: nameKey(req.body.name) })) throw new AppError(409, 'A company with this name is already registered');
    const company = await Company.create({ name: req.body.name, nameKey: nameKey(req.body.name), owner: req.user._id });
    res.status(201).json({ success: true, message: 'Company registered', company: await serialize.company(company) });
  });

  router.get('/', async (req, res) => {
    const companies = await Company.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, companies: await Promise.all(companies.map(serialize.company)) });
  });

  router.get('/:id', async (req, res) => {
    res.json({ success: true, company: await serialize.company(await ownCompany(req.params.id, req.user)) });
  });

  router.patch('/:id', uploads({ logo: 'image' }), validate(updateSchema), async (req, res) => {
    const company = await ownCompany(req.params.id, req.user);
    const { name: newName, ...rest } = req.body;
    if (newName && nameKey(newName) !== company.nameKey) {
      if (await Company.exists({ nameKey: nameKey(newName) })) throw new AppError(409, 'A company with this name is already registered');
      Object.assign(company, { name: newName, nameKey: nameKey(newName) });
    }
    Object.assign(company, rest);
    const logo = req.files?.logo?.[0];
    const oldLogo = logo ? company.logoKey : null;
    if (logo) company.logoKey = await storage.put('logos', company.id, logo);
    await company.save();
    await storage.remove(oldLogo);
    res.json({ success: true, message: 'Company updated', company: await serialize.company(company) });
  });

  return router;
}
