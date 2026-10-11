import mongoose from 'mongoose';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { seedIfEmpty } from './scripts/seedData.js';
import { createMemoryStorage, createS3Storage } from './storage/index.js';

/** Builds the app from the environment; shared by the local server and the Vercel function. */
export function build() {
  const env = loadEnv();
  const storage = env.S3_BUCKET
    ? createS3Storage({ bucket: env.S3_BUCKET, region: env.S3_REGION, accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY })
    : createMemoryStorage();
  if (!env.S3_BUCKET) console.warn('S3_BUCKET is not set: uploads are kept in memory and lost on restart.');
  const app = createApp({ storage, jwtSecret: env.JWT_SECRET, corsOrigins: env.corsOrigins, secureCookies: env.secureCookies, trustProxy: env.TRUST_PROXY_HOPS });

  let connecting;
  const connect = () =>
    (connecting ??= mongoose
      .connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 })
      .then(async () => {
        if (env.SEED_ON_START === 'true') await seedIfEmpty();
      })
      .catch((err) => {
        connecting = undefined; // let the next request retry
        throw err;
      }));

  return { env, app, connect };
}
