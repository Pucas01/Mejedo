import express from "express";
import requireAuth from "../../authMiddleware.js";
import {
  getAllGuilds,
  getTopWords,
  exportAllStats,
  importStats,
  clearGuildStats,
  getDbPath
} from "./wordStatsDb.js";
import { STOP_WORDS } from "./wordTracker.js";
import fs from "fs";

const router = express.Router();

// GET /api/word-stats/guilds - Get all guilds with stats
router.get("/guilds", requireAuth, async (req, res) => {
  try {
    const guilds = await getAllGuilds();
    res.json(guilds);
  } catch (error) {
    console.error("Error fetching guilds:", error);
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

// GET /api/word-stats/guild/:guildId - Get stats for a specific guild
router.get("/guild/:guildId", requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const filtered = req.query.filtered !== "false";
    const stopWords = filtered ? STOP_WORDS : null;

    const topWords = await getTopWords(guildId, 25, stopWords);
    res.json({ topWords });
  } catch (error) {
    console.error("Error fetching guild stats:", error);
    res.status(500).json({ error: "Failed to fetch guild stats" });
  }
});

// GET /api/word-stats/export - Export all stats as JSON
router.get("/export", requireAuth, async (req, res) => {
  try {
    const data = await exportAllStats();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=word-stats-export.json");
    res.json(data);
  } catch (error) {
    console.error("Error exporting stats:", error);
    res.status(500).json({ error: "Failed to export stats" });
  }
});

// POST /api/word-stats/import - Import stats from JSON
router.post("/import", requireAuth, async (req, res) => {
  try {
    const data = req.body;

    if (!data || (!data.allTime && !data.weekly)) {
      return res.status(400).json({ error: "Invalid import data format" });
    }

    await importStats(data);
    res.json({ success: true, message: "Stats imported successfully" });
  } catch (error) {
    console.error("Error importing stats:", error);
    res.status(500).json({ error: "Failed to import stats" });
  }
});

// DELETE /api/word-stats/guild/:guildId - Clear stats for a guild
router.delete("/guild/:guildId", requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    await clearGuildStats(guildId);
    res.json({ success: true, message: "Guild stats cleared" });
  } catch (error) {
    console.error("Error clearing guild stats:", error);
    res.status(500).json({ error: "Failed to clear guild stats" });
  }
});

export default router;
