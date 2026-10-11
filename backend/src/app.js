import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { makeSerializers } from './lib/serialize.js';
import { errorHandler, notFoundRoute } from './middleware/errors.js';
import { applicationRoutes } from './routes/applications.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { companyRoutes } from './routes/companies.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';
import { userRoutes } from './routes/users.routes.js';

export function createApp({ storage, jwtSecret, corsOrigins = [], secureCookies = true, trustProxy = 0 }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use(helmet());
  if (corsOrigins.length) app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const deps = { storage, jwtSecret, secureCookies, serialize: makeSerializers(storage) };
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/auth', authRoutes(deps));
  app.use('/api/v1/users', userRoutes(deps));
  app.use('/api/v1/companies', companyRoutes(deps));
  app.use('/api/v1/jobs', jobRoutes(deps));
  app.use('/api/v1/applications', applicationRoutes(deps));
  app.use('/api', notFoundRoute);
  app.use(errorHandler);
  return app;
}
