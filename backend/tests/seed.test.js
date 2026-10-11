import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Job } from '../src/models/Job.js';
import { User } from '../src/models/User.js';
import { DEMO_PASSWORD, seedDemoData, seedIfEmpty } from '../src/scripts/seedData.js';
import { buildApp, signUp } from './helpers.js';

const { app } = buildApp();

describe('demo seed', () => {
  it('fills an empty database once, and the demo accounts can sign in', async () => {
    expect(await seedIfEmpty()).toEqual({ companies: 5, jobs: 12 });
    expect(await seedIfEmpty()).toBeNull();
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'student@jobconnect.dev', password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
    const mine = await request(app).get('/api/v1/applications/mine').set('Cookie', login.headers['set-cookie']);
    expect(mine.body.applications).toHaveLength(2);
  });

  it('re-running resets only the demo data and leaves real users alone', async () => {
    const real = await signUp(app, 'recruiter', { email: 'real@example.com' });
    await seedDemoData();
    await seedDemoData();
    expect(await Job.countDocuments()).toBe(12);
    expect(await User.exists({ email: real.email })).toBeTruthy();
  });
});
