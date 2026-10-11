import bcrypt from 'bcryptjs';
import { Application } from '../models/Application.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';

export const DEMO_PASSWORD = 'Demo@1234';
export const DEMO_ACCOUNTS = [
  { fullname: 'Riya Kapoor', email: 'recruiter@jobconnect.dev', phoneNumber: '9810012345', role: 'recruiter' },
  { fullname: 'Arjun Mehta', email: 'student@jobconnect.dev', phoneNumber: '9820054321', role: 'student', profile: { bio: 'Final-year CS student who likes building web apps.', skills: ['React', 'Node.js', 'MongoDB', 'SQL'] } },
];

// Fictional companies, so the demo never looks like a real employer's listing.
const COMPANIES = [
  { name: 'Northwind Labs', location: 'Bengaluru', website: 'https://northwind.example', description: 'Product studio building developer tools used by 2,000 teams.' },
  { name: 'Kestrel Fintech', location: 'Mumbai', website: 'https://kestrel.example', description: 'Payments and lending infrastructure for small businesses.' },
  { name: 'Banyan Health', location: 'Pune', website: 'https://banyan.example', description: 'Clinic software that keeps patient records simple and private.' },
  { name: 'Monsoon Studios', location: 'Hyderabad', website: 'https://monsoon.example', description: 'Design-led agency shipping mobile apps for consumer brands.' },
  { name: 'Indus Logistics', location: 'Gurugram', website: 'https://indus.example', description: 'Route planning and fleet tracking for 300+ delivery partners.' },
];

const JOBS = [
  ['Northwind Labs', 'Frontend Engineer', 'Full-time', 14, 2, 3, ['React', 'TypeScript', 'CSS'], 'Own the UI of our flagship developer console: performance, accessibility and a design system used across five products.'],
  ['Northwind Labs', 'Backend Engineer (Node.js)', 'Full-time', 18, 3, 2, ['Node.js', 'PostgreSQL', 'AWS'], 'Design APIs and background jobs that handle millions of events a day, with strong testing and observability.'],
  ['Northwind Labs', 'Software Engineering Intern', 'Internship', 4, 0, 5, ['JavaScript', 'Git', 'Problem solving'], 'Six-month internship pairing with senior engineers on real features that ship to customers.'],
  ['Kestrel Fintech', 'Full Stack Developer', 'Full-time', 16, 2, 2, ['React', 'Node.js', 'MongoDB'], 'Build lending journeys end to end, from loan application forms to the services that approve them.'],
  ['Kestrel Fintech', 'Data Analyst', 'Full-time', 10, 1, 2, ['SQL', 'Python', 'Power BI'], 'Turn payment and repayment data into dashboards and insights that guide credit decisions.'],
  ['Kestrel Fintech', 'QA Automation Engineer', 'Contract', 12, 2, 1, ['Playwright', 'API testing', 'CI'], 'Grow our automated test suite across web and API, and keep releases safe and fast.'],
  ['Banyan Health', 'Android Developer', 'Full-time', 15, 3, 1, ['Kotlin', 'Jetpack Compose', 'REST'], 'Build the offline-first app doctors use to record visits in clinics with patchy internet.'],
  ['Banyan Health', 'Product Designer', 'Full-time', 13, 2, 1, ['Figma', 'User research', 'Prototyping'], 'Shape workflows for busy clinic staff, from early research to polished, tested designs.'],
  ['Monsoon Studios', 'UI/UX Design Intern', 'Internship', 3, 0, 2, ['Figma', 'Visual design', 'Portfolio'], 'Work on real client projects with our design leads; a strong portfolio matters more than a degree.'],
  ['Monsoon Studios', 'React Native Developer', 'Remote', 17, 3, 2, ['React Native', 'TypeScript', 'Animations'], 'Ship smooth, delightful mobile apps for consumer brands, working remotely with a small team.'],
  ['Indus Logistics', 'DevOps Engineer', 'Full-time', 20, 4, 1, ['Kubernetes', 'Terraform', 'AWS'], 'Run and automate the platform behind live fleet tracking, with a focus on reliability and cost.'],
  ['Indus Logistics', 'Operations Analyst', 'Part-time', 6, 1, 2, ['Excel', 'SQL', 'Communication'], 'Track delivery performance and help partners fix delays, about 20 hours a week.'],
];

const ORDER = [0, 3, 6, 9, 10, 1, 4, 7, 11, 2, 5, 8];

/** Creates the demo accounts, companies and jobs. Only touches records it owns (by demo email). */
export async function seedDemoData() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [recruiter, student] = await Promise.all(
    DEMO_ACCOUNTS.map((a) => User.findOneAndUpdate({ email: a.email }, { ...a, password }, { upsert: true, new: true, setDefaultsOnInsert: true })),
  );

  const oldCompanies = await Company.find({ owner: recruiter._id }, { _id: 1 });
  const oldJobs = await Job.find({ createdBy: recruiter._id }, { _id: 1 });
  await Application.deleteMany({ $or: [{ job: { $in: oldJobs.map((j) => j._id) } }, { applicant: student._id }] });
  await Job.deleteMany({ createdBy: recruiter._id });
  await Company.deleteMany({ _id: { $in: oldCompanies.map((c) => c._id) } });

  const companies = await Company.insertMany(COMPANIES.map((c) => ({ ...c, nameKey: c.name.toLowerCase(), owner: recruiter._id })), { ordered: false }).catch((err) => {
    // A real user may already own one of these names; keep going with the rest.
    if (err?.code === 11000 || err?.writeErrors) return err.insertedDocs ?? [];
    throw err;
  });
  const byName = new Map(companies.map((c) => [c.name, c]));
  const now = Date.now();
  const jobs = await Job.insertMany(
    JOBS.filter(([company]) => byName.has(company)).map(([company, title, jobType, salary, experienceLevel, position, requirements, description], i) => ({
      title,
      jobType,
      salary,
      experienceLevel,
      position,
      requirements,
      description,
      location: byName.get(company).location,
      company: byName.get(company)._id,
      createdBy: recruiter._id,
      // Interleave companies so the newest jobs aren't all from one employer.
      createdAt: new Date(now - ORDER.indexOf(i) * 5 * 60 * 60 * 1000),
    })),
  );
  if (jobs.length >= 4) {
    await Application.insertMany([
      { job: jobs[0]._id, applicant: student._id, status: 'pending' },
      { job: jobs[3]._id, applicant: student._id, status: 'accepted' },
    ]);
  }
  return { companies: companies.length, jobs: jobs.length };
}

/** Seeds only a brand-new database, so a fresh deploy or clone has something to look at. */
export async function seedIfEmpty() {
  if (await User.estimatedDocumentCount()) return null;
  return seedDemoData();
}
