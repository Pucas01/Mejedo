import express from "express";
import fs from "fs/promises";
import path from "path";
import requireAuth from "../../authMiddleware.js";

const router = express.Router();

const CONFIG_DIR = path.join(process.cwd(), "config");
const LEADERBOARD_FILE = path.join(CONFIG_DIR, "speedrunLeaderboard.json");

router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    const leaderboard = JSON.parse(data);

    const sorted = leaderboard.sort((a, b) => a.time - b.time);

    res.json(sorted);
  } catch (error) {
    console.error('Error reading speedrun leaderboard:', error);

    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Failed to load leaderboard' });
    }
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, time, date, version, notes } = req.body;

    if (!name || !time || !date || !version) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let leaderboard = [];
    try {
      const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
      leaderboard = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    leaderboard.push({
      name,
      time: parseInt(time),
      date,
      version,
      notes: notes || ""
    });

    leaderboard.sort((a, b) => a.time - b.time);

    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding speedrun entry:', error);
    res.status(500).json({ error: 'Failed to add speedrun entry' });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { index } = req.body;

    if (index === undefined) {
      return res.status(400).json({ error: 'Missing index' });
    }

    const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    let leaderboard = JSON.parse(data);

    leaderboard.splice(index, 1);

    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting speedrun entry:', error);
    res.status(500).json({ error: 'Failed to delete speedrun entry' });
  }
});

export default router;
