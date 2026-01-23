import express from 'express';
import requireAuth from '../../authMiddleware.js';
import {
  getTopTracks,
  getTopArtists,
  getTopTracksForUser,
  getTopArtistsForUser,
  getUserStats,
  getTrackedUsers,
  getOptedOutUsers,
  getAllGuildsWithStats,
  getAllUsersWithStats,
  exportAllStats,
  clearGuildStats,
  getDbPath,
} from './spotifyStatsDb.js';
import { getDiscordBotInstance } from '../../server.js';

const router = express.Router();

// Helper function to validate and sanitize limit parameter
function validateLimit(limit, defaultLimit = 10, maxLimit = 100) {
  const parsed = parseInt(limit);
  if (isNaN(parsed) || parsed < 1) return defaultLimit;
  return Math.min(parsed, maxLimit);
}

// Get all opted-out users (for admin info)
router.get('/opted-out-users', requireAuth, async (req, res) => {
  try {
    const users = await getOptedOutUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching opted-out users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all guilds with stats (for admin info)
router.get('/all-guilds', requireAuth, async (req, res) => {
  try {
    const guilds = await getAllGuildsWithStats();

    // Enrich with guild names from Discord client
    const botInstance = getDiscordBotInstance();
    const client = botInstance?.getClient();
    if (client && client.isReady()) {
      for (const guild of guilds) {
        try {
          const discordGuild = await client.guilds.fetch(guild.guild_id);
          guild.guild_name = discordGuild?.name || 'Unknown Guild';
        } catch (error) {
          guild.guild_name = 'Unknown Guild';
        }
      }
    } else {
      // If bot is not running, set placeholder names
      for (const guild of guilds) {
        guild.guild_name = 'Unknown Guild';
      }
    }

    res.json(guilds);
  } catch (error) {
    console.error('Error fetching all guilds:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users with stats (for admin info)
router.get('/all-users', requireAuth, async (req, res) => {
  try {
    const users = await getAllUsersWithStats();

    // Enrich with usernames from Discord client
    const botInstance = getDiscordBotInstance();
    const client = botInstance?.getClient();
    if (client && client.isReady()) {
      for (const user of users) {
        try {
          const discordUser = await client.users.fetch(user.user_id);
          user.username = discordUser?.username || 'Unknown User';
          user.display_name = discordUser?.globalName || discordUser?.username || 'Unknown User';
        } catch (error) {
          user.username = 'Unknown User';
          user.display_name = 'Unknown User';
        }
      }
    } else {
      // If bot is not running, set placeholder names
      for (const user of users) {
        user.username = 'Unknown User';
        user.display_name = 'Unknown User';
      }
    }

    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: error.message });
  }
});

// LEGACY: Get all tracked users (optionally filtered by guild)
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

// Get tracked users for a specific guild
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

// Get server-wide top tracks
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

// Get server-wide top artists
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

// Get user's top tracks
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

// Get user's top artists
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

// Get user's stats summary
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

// Export all stats (admin only)
router.get('/export', requireAuth, async (req, res) => {
  try {
    const stats = await exportAllStats();
    res.json(stats);
  } catch (error) {
    console.error('Error exporting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear guild stats (admin only)
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

// Get database info (admin only)
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
