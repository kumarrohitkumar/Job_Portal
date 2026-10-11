import { z } from 'zod';

const DEV_JWT_SECRET = 'dev-only-secret-change-me-dev-only-secret';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(8000),
    MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/jobportal'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default(DEV_JWT_SECRET),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
    SEED_ON_START: z.enum(['true', 'false']).default('false'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().default('ap-south-1'),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
  })
  .refine((e) => e.NODE_ENV !== 'production' || e.JWT_SECRET !== DEV_JWT_SECRET, { message: 'Set JWT_SECRET in production', path: ['JWT_SECRET'] })
  .refine((e) => e.NODE_ENV !== 'production' || e.S3_BUCKET, { message: 'Set S3_BUCKET in production', path: ['S3_BUCKET'] });

export function loadEnv(source = process.env) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  const env = parsed.data;
  return { ...env, corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean), secureCookies: env.NODE_ENV === 'production' };
}
