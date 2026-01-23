import express from 'express';
import * as gameStatsDb from './gameStatsDb.js';
import requireAuth from '../../authMiddleware.js';
import sqlite3 from 'sqlite3';

const router = express.Router();

// Get top games for a guild (all-time or weekly)
router.get('/guild/:guildId/top-games', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const weekly = req.query.weekly === 'true';

    const topGames = await gameStatsDb.getTopGames(guildId, limit, weekly);
    res.json(topGames);
  } catch (error) {
    console.error('Error fetching top games:', error);
    res.status(500).json({ error: 'Failed to fetch top games' });
  }
});

// Get top gamers for a guild (all-time or weekly)
router.get('/guild/:guildId/top-gamers', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const weekly = req.query.weekly === 'true';

    const topGamers = await gameStatsDb.getTopGamers(guildId, limit, weekly);
    res.json(topGamers);
  } catch (error) {
    console.error('Error fetching top gamers:', error);
    res.status(500).json({ error: 'Failed to fetch top gamers' });
  }
});

// Get user's top games
router.get('/guild/:guildId/user/:userId/top-games', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const weekly = req.query.weekly === 'true';

    const topGames = await gameStatsDb.getUserTopGames(guildId, userId, limit, weekly);
    res.json(topGames);
  } catch (error) {
    console.error('Error fetching user top games:', error);
    res.status(500).json({ error: 'Failed to fetch user top games' });
  }
});

// Get user's gaming stats summary
router.get('/guild/:guildId/user/:userId/stats', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const weekly = req.query.weekly === 'true';

    const stats = await gameStatsDb.getUserStats(guildId, userId, weekly);
    res.json(stats || {});
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get guild gaming stats summary
router.get('/guild/:guildId/stats', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const weekly = req.query.weekly === 'true';

    const stats = await gameStatsDb.getGuildStats(guildId, weekly);
    res.json(stats || {});
  } catch (error) {
    console.error('Error fetching guild stats:', error);
    res.status(500).json({ error: 'Failed to fetch guild stats' });
  }
});

// Export all game stats data (admin only)
router.get('/export', requireAuth, async (req, res) => {
  try {
    const data = await gameStatsDb.exportAllData();
    res.json(data);
  } catch (error) {
    console.error('Error exporting game stats:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete guild data (admin only)
router.delete('/guild/:guildId', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    await gameStatsDb.deleteGuildData(guildId);
    res.json({ success: true, message: 'Guild game stats deleted' });
  } catch (error) {
    console.error('Error deleting guild game stats:', error);
    res.status(500).json({ error: 'Failed to delete guild stats' });
  }
});

// Get database info (admin only)
router.get('/db-info', requireAuth, (req, res) => {
  try {
    const dbPath = gameStatsDb.getDbPath();
    res.json({ path: dbPath });
  } catch (error) {
    console.error('Error fetching db info:', error);
    res.status(500).json({ error: 'Failed to fetch database info' });
  }
});

// Get all guilds with game data (admin only)
router.get('/all-guilds', requireAuth, (req, res) => {
  try {
    const dbPath = gameStatsDb.getDbPath();
    const db = new sqlite3.Database(dbPath);

    db.all(`
      SELECT
        guild_id,
        COUNT(DISTINCT user_id) as gamer_count,
        COUNT(*) as session_count,
        SUM(duration_seconds) as total_seconds
      FROM game_sessions
      WHERE end_time IS NOT NULL
      GROUP BY guild_id
      ORDER BY total_seconds DESC
    `, [], (err, guilds) => {
      db.close();

      if (err) {
        console.error('Error fetching all guilds:', error);
        return res.status(500).json({ error: 'Failed to fetch guilds' });
      }

      res.json(guilds);
    });
  } catch (error) {
    console.error('Error fetching all guilds:', error);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

export default router;
