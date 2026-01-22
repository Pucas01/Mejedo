import express from 'express';
import requireAuth from '../../authMiddleware.js';
import {
  getTopTracks,
  getTopArtists,
  getTopTracksForUser,
  getTopArtistsForUser,
  getUserStats,
  getTrackedUsers,
  exportAllStats,
  clearGuildStats,
  getDbPath,
} from './spotifyStatsDb.js';

const router = express.Router();

function validateLimit(limit, defaultLimit = 10, maxLimit = 100) {
  const parsed = parseInt(limit);
  if (isNaN(parsed) || parsed < 1) return defaultLimit;
  return Math.min(parsed, maxLimit);
}

router.get('/tracked-users', async (req, res) => {
  try {
    const guildId = req.query.guildId;
    const users = guildId ? await getTrackedUsers(guildId) : await getTrackedUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching tracked users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guild/:guildId/tracked-users', async (req, res) => {
  try {
    const { guildId } = req.params;
    const users = await getTrackedUsers(guildId);
    res.json(users);
  } catch (error) {
    console.error('Error fetching tracked users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guild/:guildId/top-tracks', async (req, res) => {
  try {
    const { guildId } = req.params;
    const limit = validateLimit(req.query.limit, 10, 100);
    const tracks = await getTopTracks(guildId, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guild/:guildId/top-artists', async (req, res) => {
  try {
    const { guildId } = req.params;
    const limit = validateLimit(req.query.limit, 10, 100);
    const artists = await getTopArtists(guildId, limit);
    res.json(artists);
  } catch (error) {
    console.error('Error fetching top artists:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guild/:guildId/user/:userId/top-tracks', async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const limit = validateLimit(req.query.limit, 10, 100);
    const tracks = await getTopTracksForUser(guildId, userId, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching user top tracks:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guild/:guildId/user/:userId/top-artists', async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const limit = validateLimit(req.query.limit, 10, 100);
    const artists = await getTopArtistsForUser(guildId, userId, limit);
    res.json(artists);
  } catch (error) {
    console.error('Error fetching user top artists:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guild/:guildId/user/:userId/stats', async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const stats = await getUserStats(guildId, userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/export', requireAuth, async (req, res) => {
  try {
    const stats = await exportAllStats();
    res.json(stats);
  } catch (error) {
    console.error('Error exporting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/guild/:guildId', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    await clearGuildStats(guildId);
    res.json({ success: true, message: 'Guild stats cleared' });
  } catch (error) {
    console.error('Error clearing guild stats:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/db-info', requireAuth, async (req, res) => {
  try {
    const dbPath = getDbPath();
    res.json({ path: dbPath });
  } catch (error) {
    console.error('Error fetching db info:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
