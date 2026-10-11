import mongoose from 'mongoose';
import { loadEnv } from '../config/env.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDemoData } from './seedData.js';

const env = loadEnv();
await mongoose.connect(env.MONGO_URI);
const result = await seedDemoData();
console.log(`Seeded ${result.companies} companies and ${result.jobs} jobs.`);
for (const a of DEMO_ACCOUNTS) console.log(`  ${a.role.padEnd(9)} ${a.email} / ${DEMO_PASSWORD}`);
await mongoose.disconnect();
