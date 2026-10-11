import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryStorage } from '../src/storage/index.js';

export const PASSWORD = 'Secret@123';

export function buildApp() {
  const storage = createMemoryStorage();
  const app = createApp({ storage, jwtSecret: 'test-secret', corsOrigins: [], secureCookies: false });
  return { app, storage };
}

let n = 0;
/** Registers a user and returns their cookie, so tests can act as them. */
export async function signUp(app, role = 'student', overrides = {}) {
  n += 1;
  const body = {
    fullname: overrides.fullname ?? `User ${n}`,
    email: overrides.email ?? `user${n}@example.com`,
    phoneNumber: overrides.phoneNumber ?? '9876543210',
    password: PASSWORD,
    role,
  };
  const res = await request(app).post('/api/v1/auth/register').send(body);
  if (res.status !== 201) throw new Error(`signUp failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { cookie: res.headers['set-cookie'], user: res.body.user, email: body.email };
}

export async function createCompany(app, cookie, name = `Acme ${++n}`) {
  const res = await request(app).post('/api/v1/companies').set('Cookie', cookie).send({ name });
  if (res.status !== 201) throw new Error(`createCompany failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.company;
}

export const jobInput = (companyId, overrides = {}) => ({
  title: 'Frontend Developer',
  description: 'Build fast, accessible React interfaces for our hiring products.',
  requirements: ['React', 'TypeScript'],
  salary: 12,
  experienceLevel: 2,
  location: 'Bengaluru',
  jobType: 'Full-time',
  position: 3,
  companyId,
  ...overrides,
});

export async function postJob(app, cookie, companyId, overrides = {}) {
  const res = await request(app).post('/api/v1/jobs').set('Cookie', cookie).send(jobInput(companyId, overrides));
  if (res.status !== 201) throw new Error(`postJob failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.job;
}
