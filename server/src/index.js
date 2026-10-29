import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB } from './config/db.js';
import chatRoutes from './routes/chat.js';
import avatarRoutes from './routes/avatars.js';
import sessionRoutes from './routes/sessions.js';
import worldStateRoutes from './routes/worldState.js';
import modelRoutes from './routes/models.js';
import characterActionRoutes from './routes/characterAction.js';
import settingsRoutes from './routes/settings.js';
import bgmRoutes from './routes/bgm.js';
import { Session } from './models/Session.js';
import { WorldState } from './models/WorldState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (supports root .env and server/.env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/roleplay/chat', chatRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/world-state', worldStateRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/character-action', characterActionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bgm', bgmRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Re-Birth Anime Roleplay Engine'
  });
});

// Serve frontend dist if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[Server] Re-Birth Backend listening at http://localhost:${PORT}`);
  });
}

// In Vercel serverless environment, do not bind port; export app instead
if (!process.env.VERCEL) {
  startServer();
}

export default app;
