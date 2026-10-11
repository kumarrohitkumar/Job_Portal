import { expect } from '@playwright/test';

export const RUN = Date.now().toString(36);
export const PASSWORD = 'E2e@Pass123';
export const email = (who) => `e2e.${who}.${RUN}@example.com`;

// Tiny valid files, so tests never depend on fixtures on disk.
export const PDF = { name: 'Resume E2E.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n') };
export const PNG = {
  name: 'logo.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
};

export async function signUp(page, { role, name, who }) {
  await page.goto(`/signup${role === 'recruiter' ? '?role=recruiter' : ''}`);
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email').fill(email(who));
  await page.getByLabel('Phone number').fill('9876543210');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(role === 'recruiter' ? /\/recruiter\/jobs$/ : /\/jobs$/);
}

export async function signIn(page, who) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email(who));
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function signOut(page) {
  await page.context().clearCookies();
}
