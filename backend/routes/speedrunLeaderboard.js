import express from "express";
import fs from "fs/promises";
import path from "path";
import requireAuth from "../authMiddleware.js";

const router = express.Router();

const CONFIG_DIR = path.join(process.cwd(), "config");
const LEADERBOARD_FILE = path.join(CONFIG_DIR, "speedrunLeaderboard.json");

// Get speedrun leaderboard
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    const leaderboard = JSON.parse(data);

    // Sort by time (ascending - fastest first)
    const sorted = leaderboard.sort((a, b) => a.time - b.time);

    res.json(sorted);
  } catch (error) {
    console.error('Error reading speedrun leaderboard:', error);

    // If file doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Failed to load leaderboard' });
    }
  }
});

// Add new speedrun entry (Admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, time, date, version, notes } = req.body;

    if (!name || !time || !date || !version) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Read existing leaderboard
    let leaderboard = [];
    try {
      const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
      leaderboard = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Add new entry
    leaderboard.push({
      name,
      time: parseInt(time),
      date,
      version,
      notes: notes || ""
    });

    // Sort by time
    leaderboard.sort((a, b) => a.time - b.time);

    // Write back to file
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding speedrun entry:', error);
    res.status(500).json({ error: 'Failed to add speedrun entry' });
  }
});

// Delete speedrun entry (Admin only)
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { index } = req.body;

    if (index === undefined) {
      return res.status(400).json({ error: 'Missing index' });
    }

    // Read existing leaderboard
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    let leaderboard = JSON.parse(data);

    // Remove entry at index
    leaderboard.splice(index, 1);

    // Write back to file
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting speedrun entry:', error);
    res.status(500).json({ error: 'Failed to delete speedrun entry' });
  }
});

export default router;
