import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { User } from '../src/models/User.js';
import { buildApp, PASSWORD, signUp } from './helpers.js';

const { app } = buildApp();

describe('auth', () => {
  it('registers a user, hashes the password and sets an httpOnly session cookie', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullname: 'Asha Rao',
      email: 'Asha@Example.com',
      phoneNumber: '09876543210',
      password: PASSWORD,
      role: 'student',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ fullname: 'Asha Rao', email: 'asha@example.com', role: 'student', phoneNumber: '09876543210' });
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=.+HttpOnly/i);

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe(PASSWORD);
  });

  it('rejects a duplicate email with 409', async () => {
    await signUp(app, 'student', { email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullname: 'Again', email: 'dup@example.com', phoneNumber: '9876543210', password: PASSWORD, role: 'student' });
    expect(res.status).toBe(409);
  });

  it('validates the sign-up fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullname: '', email: 'not-an-email', phoneNumber: '12', password: 'short', role: 'admin' });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['fullname', 'email', 'phoneNumber', 'password', 'role']));
  });

  it('logs in with the right password, and refuses a wrong one with 401', async () => {
    const { email } = await signUp(app, 'recruiter');
    const ok = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('recruiter');

    const bad = await request(app).post('/api/v1/auth/login').send({ email, password: 'Wrong@123' });
    expect(bad.status).toBe(401);
    const unknown = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: PASSWORD });
    expect(unknown.status).toBe(401);
    expect(unknown.body.message).toBe(bad.body.message);
  });

  it('returns the signed-in user from /me, and 401 without a session or with a bad token', async () => {
    const { cookie, user } = await signUp(app);
    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(user.id);

    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me').set('Cookie', 'token=garbage')).status).toBe(401);
  });

  it('logs out by clearing the cookie', async () => {
    const { cookie } = await signUp(app);
    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/);
  });
});

describe('profile', () => {
  it('updates name, phone, bio and skills', async () => {
    const { cookie } = await signUp(app);
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Cookie', cookie)
      .field('fullname', 'Asha R')
      .field('phoneNumber', '9123456780')
      .field('bio', 'Frontend engineer')
      .field('skills', 'React, Node.js ,  SQL');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ fullname: 'Asha R', phoneNumber: '9123456780', profile: { bio: 'Frontend engineer', skills: ['React', 'Node.js', 'SQL'] } });
  });

  it('refuses an email that another account uses', async () => {
    await signUp(app, 'student', { email: 'taken@example.com' });
    const { cookie } = await signUp(app);
    const res = await request(app).patch('/api/v1/users/me').set('Cookie', cookie).field('email', 'taken@example.com');
    expect(res.status).toBe(409);
  });

  it('stores a PDF resume and returns a link to it', async () => {
    const { app: app2, storage } = buildApp();
    const { cookie } = await signUp(app2);
    const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(100)]);
    const res = await request(app2).patch('/api/v1/users/me').set('Cookie', cookie).attach('resume', pdf, { filename: 'Asha CV.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(200);
    expect(res.body.user.profile.resumeOriginalName).toBe('Asha CV.pdf');
    expect(res.body.user.profile.resumeUrl).toMatch(/^memory:\/\/resumes\//);
    expect(storage.files.size).toBe(1);
  });

  it('refuses a resume that is not a PDF, and files over 2 MB', async () => {
    const { cookie } = await signUp(app);
    const exe = await request(app).patch('/api/v1/users/me').set('Cookie', cookie).attach('resume', Buffer.from('MZ....'), { filename: 'cv.pdf', contentType: 'application/pdf' });
    expect(exe.status).toBe(400);
    const big = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(2 * 1024 * 1024 + 1)]);
    const tooBig = await request(app).patch('/api/v1/users/me').set('Cookie', cookie).attach('resume', big, { filename: 'cv.pdf', contentType: 'application/pdf' });
    expect(tooBig.status).toBe(400);
  });

  it('stores a profile photo (JPG, PNG or WebP)', async () => {
    const { cookie } = await signUp(app);
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(50)]);
    const res = await request(app).patch('/api/v1/users/me').set('Cookie', cookie).attach('photo', png, { filename: 'me.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.user.profile.photoUrl).toMatch(/^memory:\/\/photos\//);
  });
});
