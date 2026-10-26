import express from 'express';
import { WorldState } from '../models/WorldState.js';

const router = express.Router();

/**
 * GET /api/world-state/:sessionId
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    let worldState = await WorldState.findOne({ sessionId });
    if (!worldState) {
      worldState = await WorldState.create({ sessionId });
    }
    res.json(worldState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/world-state/:sessionId
 */
router.put('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;

    const worldState = await WorldState.findOneAndUpdate(
      { sessionId },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json(worldState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
