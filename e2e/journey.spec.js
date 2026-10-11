import { expect, test } from '@playwright/test';
import { email, PDF, PNG, RUN, signIn, signOut, signUp } from './helpers.js';

const company = `E2E Robotics ${RUN}`;
const jobTitle = `E2E Platform Engineer ${RUN}`;

// One hiring story end to end, in order: a recruiter posts, a student applies, the recruiter shortlists.
test.describe.serial('hiring journey', () => {
  test('a guest can browse, search and open a job, and is asked to sign in to apply', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Fresh openings' })).toBeVisible();
    await page.getByLabel('Job title, skill or keyword').fill('engineer');
    await page.getByRole('button', { name: 'Show me jobs' }).click();
    await expect(page).toHaveURL(/\/jobs\?keyword=engineer/);
    await expect(page.getByText(/\d+ jobs? for “engineer”/)).toBeVisible();

    await page.getByRole('button', { name: 'Internship', exact: true }).click();
    await expect(page).toHaveURL(/jobType=Internship/);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).toHaveURL(/\/jobs$/);

    await page.locator('article h3 a').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('link', { name: 'Sign in to apply' }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fjobs%2F/);
  });

  test('sign-up shows clear errors for bad input', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('A');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Phone number').fill('12');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('a recruiter registers a company with a logo and posts a job', async ({ page }) => {
    await signUp(page, { role: 'recruiter', name: 'Rekha Recruiter', who: 'recruiter' });
    await expect(page.getByText("You haven't posted a job yet")).toBeVisible();

    await page.getByRole('link', { name: 'Companies' }).first().click();
    await page.getByRole('button', { name: 'New company' }).click();
    await page.getByLabel('Company name').fill(company);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Company details' })).toBeVisible();
    await page.locator('input[type=file]').setInputFiles(PNG);
    await page.getByLabel('Description').fill('Robots that sort parcels for e-commerce warehouses.');
    await page.getByLabel('Website').fill('https://robotics.example');
    await page.getByLabel('Location').fill('Chennai');
    await page.getByRole('button', { name: 'Save company' }).click();
    await expect(page.getByText('Company updated')).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(company) })).toBeVisible();

    await page.goto('/recruiter/jobs/new');
    await page.getByLabel('Job title').fill(jobTitle);
    await page.getByLabel('Description').fill('Build and run the services that coordinate our warehouse robots.');
    await page.getByLabel('Skills and requirements').fill('Go, Kubernetes, gRPC');
    await page.getByLabel('Salary (₹ LPA)').fill('22');
    await page.getByLabel('Experience (years)').fill('3');
    await page.getByLabel('Location').fill('Chennai');
    await page.getByLabel('Job type').selectOption('Full-time');
    await page.getByLabel('Openings').fill('2');
    await page.getByRole('button', { name: 'Post job' }).click();
    await expect(page.getByText('Job posted')).toBeVisible();
    await expect(page.getByRole('link', { name: jobTitle, exact: true })).toBeVisible();

    // It is live on the public board straight away.
    await signOut(page);
    await page.goto(`/jobs?keyword=${encodeURIComponent(jobTitle)}`);
    await expect(page.getByRole('link', { name: jobTitle, exact: true })).toBeVisible();
  });

  test('a job seeker uploads a resume, applies once, and tracks the application', async ({ page }) => {
    await signUp(page, { role: 'student', name: 'Sameer Student', who: 'student' });
    await page.goto('/profile');
    await page.locator('input[type=file][accept="application/pdf"]').setInputFiles(PDF);
    await expect(page.getByRole('link', { name: /Resume E2E\.pdf/ })).toBeVisible();

    await page.getByRole('button', { name: 'Edit profile' }).click();
    await page.getByLabel('Skills').fill('Go, Docker, Linux');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Profile updated')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Docker' })).toBeVisible();

    await page.goto(`/jobs?keyword=${encodeURIComponent(jobTitle)}`);
    await page.getByRole('link', { name: jobTitle, exact: true }).click();
    await page.getByRole('button', { name: 'Apply now' }).click();
    await expect(page.getByText('You applied for this job')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Apply now' })).toHaveCount(0);

    await page.getByRole('link', { name: 'See my applications' }).click();
    const row = page.getByRole('link').filter({ hasText: jobTitle });
    await expect(row).toContainText('In review');
  });

  test('the recruiter sees the applicant with resume and shortlists them', async ({ page }) => {
    await signIn(page, 'recruiter');
    await page.goto('/recruiter/jobs');
    await page.getByRole('article').filter({ hasText: jobTitle }).getByRole('link', { name: /1 applicant/ }).click();
    const card = page.getByRole('article').filter({ hasText: 'Sameer Student' });
    await expect(card).toContainText(email('student'));
    await expect(card.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', /.+/);
    await card.getByRole('button', { name: 'Shortlist Sameer Student' }).click();
    await expect(card).toContainText('Shortlisted');
    await page.getByRole('tab', { name: /Shortlisted/ }).click();
    await expect(page.getByRole('article').filter({ hasText: 'Sameer Student' })).toBeVisible();
  });

  test('the job seeker now sees "Shortlisted"', async ({ page }) => {
    await signIn(page, 'student');
    await page.goto('/profile');
    await expect(page.getByRole('link').filter({ hasText: jobTitle })).toContainText('Shortlisted');
  });

  test('roles are enforced in the app and by the API', async ({ page }) => {
    await signIn(page, 'student');
    await page.goto('/recruiter/jobs');
    await expect(page).toHaveURL(/\/jobs$/);
    const res = await page.request.post('/api/v1/companies', { data: { name: `Sneaky ${RUN}` } });
    expect(res.status()).toBe(403);
    await signOut(page);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  });

  test('the recruiter edits and then deletes the job', async ({ page }) => {
    await signIn(page, 'recruiter');
    await page.goto('/recruiter/jobs');
    await page.getByRole('link', { name: `Edit ${jobTitle}` }).click();
    await page.getByLabel('Salary (₹ LPA)').fill('24');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Job updated')).toBeVisible();
    await expect(page.getByRole('article').filter({ hasText: jobTitle })).toContainText('₹24 LPA');

    await page.getByRole('button', { name: `Delete ${jobTitle}` }).click();
    await page.getByRole('button', { name: 'Delete job' }).click();
    await expect(page.getByText('Job deleted')).toBeVisible();
    await expect(page.getByRole('link', { name: jobTitle, exact: true })).toHaveCount(0);
  });
});

test('works on a phone: menu, search and a job page @mobile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Find jobs' }).click();
  await expect(page.getByRole('heading', { name: 'Find jobs' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.locator('article h3 a').first().click();
  await expect(page.getByRole('link', { name: 'Sign in to apply' })).toBeVisible();
});
