import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Application } from '../src/models/Application.js';
import { buildApp, createCompany, jobInput, postJob, signUp } from './helpers.js';

const { app } = buildApp();

describe('companies', () => {
  it('lets a recruiter register a company and see only their own', async () => {
    const a = await signUp(app, 'recruiter');
    const b = await signUp(app, 'recruiter');
    await createCompany(app, a.cookie, 'Zeta Labs');
    await createCompany(app, b.cookie, 'Other Co');
    const res = await request(app).get('/api/v1/companies').set('Cookie', a.cookie);
    expect(res.status).toBe(200);
    expect(res.body.companies.map((c) => c.name)).toEqual(['Zeta Labs']);
  });

  it('refuses a duplicate company name (any case) with 409', async () => {
    const a = await signUp(app, 'recruiter');
    await createCompany(app, a.cookie, 'Zeta Labs');
    const res = await request(app).post('/api/v1/companies').set('Cookie', a.cookie).send({ name: 'zeta labs' });
    expect(res.status).toBe(409);
  });

  it('does not let a student register a company', async () => {
    const s = await signUp(app, 'student');
    expect((await request(app).post('/api/v1/companies').set('Cookie', s.cookie).send({ name: 'Nope' })).status).toBe(403);
  });

  it('updates details and logo, but only for the owner', async () => {
    const owner = await signUp(app, 'recruiter');
    const other = await signUp(app, 'recruiter');
    const company = await createCompany(app, owner.cookie);

    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(50)]);
    const ok = await request(app)
      .patch(`/api/v1/companies/${company.id}`)
      .set('Cookie', owner.cookie)
      .field('description', 'We build hiring tools')
      .field('website', 'https://acme.example')
      .field('location', 'Pune')
      .attach('logo', png, { filename: 'logo.png', contentType: 'image/png' });
    expect(ok.status).toBe(200);
    expect(ok.body.company).toMatchObject({ description: 'We build hiring tools', website: 'https://acme.example', location: 'Pune' });
    expect(ok.body.company.logoUrl).toMatch(/^memory:\/\/logos\//);

    const textOnly = await request(app).patch(`/api/v1/companies/${company.id}`).set('Cookie', owner.cookie).send({ location: 'Mumbai' });
    expect(textOnly.status).toBe(200);
    expect(textOnly.body.company.logoUrl).toMatch(/^memory:\/\/logos\//);

    expect((await request(app).patch(`/api/v1/companies/${company.id}`).set('Cookie', other.cookie).send({ location: 'X' })).status).toBe(404);
    expect((await request(app).get(`/api/v1/companies/${company.id}`).set('Cookie', other.cookie)).status).toBe(404);
  });

  it('returns 404 for a malformed id instead of crashing', async () => {
    const r = await signUp(app, 'recruiter');
    expect((await request(app).get('/api/v1/companies/not-an-id').set('Cookie', r.cookie)).status).toBe(404);
  });
});

describe('jobs', () => {
  it('lets a recruiter post a job for their own company only', async () => {
    const owner = await signUp(app, 'recruiter');
    const other = await signUp(app, 'recruiter');
    const company = await createCompany(app, owner.cookie);

    const job = await postJob(app, owner.cookie, company.id);
    expect(job).toMatchObject({ title: 'Frontend Developer', requirements: ['React', 'TypeScript'], company: { id: company.id } });

    const res = await request(app).post('/api/v1/jobs').set('Cookie', other.cookie).send(jobInput(company.id));
    expect(res.status).toBe(404);
  });

  it('does not let a student post a job', async () => {
    const owner = await signUp(app, 'recruiter');
    const company = await createCompany(app, owner.cookie);
    const s = await signUp(app, 'student');
    expect((await request(app).post('/api/v1/jobs').set('Cookie', s.cookie).send(jobInput(company.id))).status).toBe(403);
  });

  it('validates the job fields', async () => {
    const owner = await signUp(app, 'recruiter');
    const company = await createCompany(app, owner.cookie);
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Cookie', owner.cookie)
      .send(jobInput(company.id, { title: '', salary: -1, position: 0, jobType: 'Gig' }));
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['title', 'salary', 'position', 'jobType']));
  });

  it('lists jobs publicly, newest first, with search and filters', async () => {
    const r = await signUp(app, 'recruiter');
    const company = await createCompany(app, r.cookie);
    await postJob(app, r.cookie, company.id, { title: 'Backend Engineer', location: 'Pune', jobType: 'Full-time' });
    await postJob(app, r.cookie, company.id, { title: 'Data Analyst', location: 'Delhi', jobType: 'Internship' });
    await postJob(app, r.cookie, company.id, { title: 'Senior Backend Engineer', location: 'Bengaluru', jobType: 'Full-time' });

    const all = await request(app).get('/api/v1/jobs');
    expect(all.status).toBe(200);
    expect(all.body.jobs.map((j) => j.title)).toEqual(['Senior Backend Engineer', 'Data Analyst', 'Backend Engineer']);
    expect(all.body.total).toBe(3);

    const kw = await request(app).get('/api/v1/jobs?keyword=backend');
    expect(kw.body.jobs).toHaveLength(2);
    const filtered = await request(app).get('/api/v1/jobs?keyword=backend&location=Pune');
    expect(filtered.body.jobs.map((j) => j.title)).toEqual(['Backend Engineer']);
    const type = await request(app).get('/api/v1/jobs?jobType=Internship');
    expect(type.body.jobs.map((j) => j.title)).toEqual(['Data Analyst']);
  });

  it('treats search text literally (no regex injection)', async () => {
    const r = await signUp(app, 'recruiter');
    const company = await createCompany(app, r.cookie);
    await postJob(app, r.cookie, company.id, { title: 'C++ Developer' });
    const res = await request(app).get('/api/v1/jobs?keyword=' + encodeURIComponent('C++'));
    expect(res.status).toBe(200);
    expect(res.body.jobs).toHaveLength(1);
    expect((await request(app).get('/api/v1/jobs?keyword=' + encodeURIComponent('(a+)+$'))).status).toBe(200);
  });

  it('shows a job publicly with its applicant count but not the applications', async () => {
    const r = await signUp(app, 'recruiter');
    const company = await createCompany(app, r.cookie);
    const job = await postJob(app, r.cookie, company.id);
    const s = await signUp(app, 'student');
    await request(app).post(`/api/v1/jobs/${job.id}/apply`).set('Cookie', s.cookie).expect(201);

    const pub = await request(app).get(`/api/v1/jobs/${job.id}`);
    expect(pub.status).toBe(200);
    expect(pub.body.job.applicantCount).toBe(1);
    expect(pub.body.job.applications).toBeUndefined();
    expect(pub.body.job.hasApplied).toBe(false);

    const mine = await request(app).get(`/api/v1/jobs/${job.id}`).set('Cookie', s.cookie);
    expect(mine.body.job.hasApplied).toBe(true);
    expect((await request(app).get('/api/v1/jobs/64b000000000000000000000')).status).toBe(404);
  });

  it("lists a recruiter's own jobs, and lets only the owner edit or delete", async () => {
    const owner = await signUp(app, 'recruiter');
    const other = await signUp(app, 'recruiter');
    const company = await createCompany(app, owner.cookie);
    const job = await postJob(app, owner.cookie, company.id);

    const mine = await request(app).get('/api/v1/jobs/mine').set('Cookie', owner.cookie);
    expect(mine.body.jobs.map((j) => j.id)).toEqual([job.id]);
    expect((await request(app).get('/api/v1/jobs/mine').set('Cookie', other.cookie)).body.jobs).toEqual([]);

    const edit = await request(app).patch(`/api/v1/jobs/${job.id}`).set('Cookie', owner.cookie).send({ salary: 18, position: 1 });
    expect(edit.status).toBe(200);
    expect(edit.body.job).toMatchObject({ salary: 18, position: 1 });
    expect((await request(app).patch(`/api/v1/jobs/${job.id}`).set('Cookie', other.cookie).send({ salary: 1 })).status).toBe(404);

    const s = await signUp(app, 'student');
    await request(app).post(`/api/v1/jobs/${job.id}/apply`).set('Cookie', s.cookie).expect(201);
    expect((await request(app).delete(`/api/v1/jobs/${job.id}`).set('Cookie', other.cookie)).status).toBe(404);
    expect((await request(app).delete(`/api/v1/jobs/${job.id}`).set('Cookie', owner.cookie)).status).toBe(200);
    expect(await Application.countDocuments()).toBe(0);
  });
});

describe('applications', () => {
  async function openJob() {
    const r = await signUp(app, 'recruiter');
    const company = await createCompany(app, r.cookie);
    const job = await postJob(app, r.cookie, company.id);
    return { recruiter: r, job };
  }

  it('lets a student apply once; a second attempt is 409', async () => {
    const { job } = await openJob();
    const s = await signUp(app, 'student');
    expect((await request(app).post(`/api/v1/jobs/${job.id}/apply`).set('Cookie', s.cookie)).status).toBe(201);
    expect((await request(app).post(`/api/v1/jobs/${job.id}/apply`).set('Cookie', s.cookie)).status).toBe(409);
  });

  it('does not let a recruiter apply, or anyone apply without signing in', async () => {
    const { job } = await openJob();
    const r = await signUp(app, 'recruiter');
    expect((await request(app).post(`/api/v1/jobs/${job.id}/apply`).set('Cookie', r.cookie)).status).toBe(403);
    expect((await request(app).post(`/api/v1/jobs/${job.id}/apply`)).status).toBe(401);
  });

  it("lists a student's applications with job and company, newest first", async () => {
    const a = await openJob();
    const b = await openJob();
    const s = await signUp(app, 'student');
    await request(app).post(`/api/v1/jobs/${a.job.id}/apply`).set('Cookie', s.cookie);
    await request(app).post(`/api/v1/jobs/${b.job.id}/apply`).set('Cookie', s.cookie);
    const res = await request(app).get('/api/v1/applications/mine').set('Cookie', s.cookie);
    expect(res.status).toBe(200);
    expect(res.body.applications.map((x) => x.job.id)).toEqual([b.job.id, a.job.id]);
    expect(res.body.applications[0]).toMatchObject({ status: 'pending', job: { title: 'Frontend Developer', company: { name: expect.any(String) } } });
  });

  it('shows applicants only to the job owner, without password hashes', async () => {
    const { recruiter, job } = await openJob();
    const s = await signUp(app, 'student', { fullname: 'Kabir Shah' });
    await request(app).post(`/api/v1/jobs/${job.id}/apply`).set('Cookie', s.cookie);

    const res = await request(app).get(`/api/v1/jobs/${job.id}/applicants`).set('Cookie', recruiter.cookie);
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].applicant).toMatchObject({ fullname: 'Kabir Shah', email: s.email });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);

    const other = await signUp(app, 'recruiter');
    expect((await request(app).get(`/api/v1/jobs/${job.id}/applicants`).set('Cookie', other.cookie)).status).toBe(404);
    expect((await request(app).get(`/api/v1/jobs/${job.id}/applicants`).set('Cookie', s.cookie)).status).toBe(403);
  });

  it('lets only the job owner accept or reject, with a valid status', async () => {
    const { recruiter, job } = await openJob();
    const s = await signUp(app, 'student');
    await request(app).post(`/api/v1/jobs/${job.id}/apply`).set('Cookie', s.cookie);
    const [appl] = (await request(app).get(`/api/v1/jobs/${job.id}/applicants`).set('Cookie', recruiter.cookie)).body.applications;

    const ok = await request(app).patch(`/api/v1/applications/${appl.id}/status`).set('Cookie', recruiter.cookie).send({ status: 'accepted' });
    expect(ok.status).toBe(200);
    expect(ok.body.application.status).toBe('accepted');

    expect((await request(app).patch(`/api/v1/applications/${appl.id}/status`).set('Cookie', recruiter.cookie).send({ status: 'hired!' })).status).toBe(400);
    const other = await signUp(app, 'recruiter');
    expect((await request(app).patch(`/api/v1/applications/${appl.id}/status`).set('Cookie', other.cookie).send({ status: 'rejected' })).status).toBe(404);

    const mine = await request(app).get('/api/v1/applications/mine').set('Cookie', s.cookie);
    expect(mine.body.applications[0].status).toBe('accepted');
  });
});

describe('platform', () => {
  it('answers health checks and unknown API routes with JSON 404', async () => {
    expect((await request(app).get('/api/health')).body).toMatchObject({ status: 'ok' });
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toEqual(expect.any(String));
  });

  it('rate-limits repeated failed logins', async () => {
    const { app: fresh } = buildApp();
    let last;
    for (let i = 0; i < 11; i += 1) last = await request(fresh).post('/api/v1/auth/login').send({ email: 'x@example.com', password: 'Wrong@123' });
    expect(last.status).toBe(429);
  });
});
