import { build } from '../src/bootstrap.js';

// Vercel serverless entry: the app and the Mongo connection live as long as the function instance.
const { app, connect } = build();

export default async function handler(req, res) {
  try {
    await connect();
  } catch (err) {
    console.error('MongoDB connection failed', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database is unavailable. Try again shortly' }));
    return;
  }
  app(req, res);
}
