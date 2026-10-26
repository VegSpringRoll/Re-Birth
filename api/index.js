import app from '../server/src/index.js';
import { connectDB } from '../server/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] DB connection error:', err);
  }
  return app(req, res);
}
