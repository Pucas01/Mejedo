import sqlite3 from 'sqlite3';
import path from 'path';
import { validateSnowflake, validateWord } from './validation.js';

const DB_FILE = path.join(process.cwd(), 'config', 'word-stats.db');
const db = new sqlite3.Database(DB_FILE);

// Create tables
db.serialize(() => {
  // All-time word stats
  db.run(`CREATE TABLE IF NOT EXISTS word_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    word TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(guild_id, user_id, word)
  )`);

  // Weekly word stats (reset after recap)
  db.run(`CREATE TABLE IF NOT EXISTS word_stats_weekly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    word TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(guild_id, user_id, word)
  )`);

  // Guild settings table
  db.run(`CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    recap_channel_id TEXT,
    recap_day INTEGER DEFAULT 0,
    recap_hour INTEGER DEFAULT 12,
    word_tracking_enabled INTEGER DEFAULT 0,
    spotify_tracking_enabled INTEGER DEFAULT 0,
    announcement_channel_id TEXT,
    announcements_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create indexes for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_word_stats_guild ON word_stats(guild_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_word_stats_weekly_guild ON word_stats_weekly(guild_id)`);

  // Migration: Add missing columns to guild_settings if they don't exist
  db.all(`PRAGMA table_info(guild_settings)`, (err, columns) => {
    if (err) {
      console.error('[Migration] Error checking guild_settings columns:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);
    const migrations = [];

    // Check for all feature flag columns
    if (!columnNames.includes('word_tracking_enabled')) {
      migrations.push({
        column: 'word_tracking_enabled',
        sql: 'ALTER TABLE guild_settings ADD COLUMN word_tracking_enabled INTEGER DEFAULT 0'
      });
    }

    if (!columnNames.includes('spotify_tracking_enabled')) {
      migrations.push({
        column: 'spotify_tracking_enabled',
        sql: 'ALTER TABLE guild_settings ADD COLUMN spotify_tracking_enabled INTEGER DEFAULT 0'
      });
    }

    if (!columnNames.includes('announcement_channel_id')) {
      migrations.push({
        column: 'announcement_channel_id',
        sql: 'ALTER TABLE guild_settings ADD COLUMN announcement_channel_id TEXT'
      });
    }

    if (!columnNames.includes('announcements_enabled')) {
      migrations.push({
        column: 'announcements_enabled',
        sql: 'ALTER TABLE guild_settings ADD COLUMN announcements_enabled INTEGER DEFAULT 0'
      });
    }

    // Run migrations sequentially
    if (migrations.length > 0) {
      console.log(`[Migration] Found ${migrations.length} missing columns in guild_settings, adding them...`);

      let index = 0;
      const runNextMigration = () => {
        if (index >= migrations.length) {
          console.log('[Migration] All guild_settings migrations completed successfully');
          return;
        }

        const migration = migrations[index];
        db.run(migration.sql, (err) => {
          if (err) {
            console.error(`[Migration] Error adding ${migration.column} column:`, err);
          } else {
            console.log(`[Migration] Added ${migration.column} column to guild_settings`);
          }
          index++;
          runNextMigration();
        });
      };

      runNextMigration();
    }
  });
});

// Promisified helpers
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Increment word count in both tables
export async function incrementWordCount(guildId, userId, word) {
  // Validate inputs
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

  // Validate word (silently skip invalid words instead of throwing)
  try {
    validateWord(word);
  } catch (error) {
    console.warn(`[Word Validation] Skipping invalid word: ${error.message}`);
    return;
  }

  // All-time stats
  await runAsync(`
    INSERT INTO word_stats (guild_id, user_id, word, count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(guild_id, user_id, word) DO UPDATE SET count = count + 1
  `, [guildId, userId, word]);

  // Weekly stats
  await runAsync(`
    INSERT INTO word_stats_weekly (guild_id, user_id, word, count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(guild_id, user_id, word) DO UPDATE SET count = count + 1
  `, [guildId, userId, word]);
}

// Get server-wide top words (all-time)
// If stopWords set is provided, filters them out
export async function getTopWords(guildId, limit = 10, stopWords = null) {
  // Validate inputs
  validateSnowflake(guildId, 'Guild ID');

  // Fetch extra results to account for filtering
  const fetchLimit = stopWords ? limit * 5 : limit;
  const results = await allAsync(`
    SELECT word, SUM(count) as total_count
    FROM word_stats
    WHERE guild_id = ?
    GROUP BY word
    ORDER BY total_count DESC
    LIMIT ?
  `, [guildId, fetchLimit]);

  if (stopWords) {
    return results.filter(r => !stopWords.has(r.word)).slice(0, limit);
  }
  return results;
}

// Get user's top words (all-time)
// If stopWords set is provided, filters them out
export async function getTopWordsForUser(guildId, userId, limit = 10, stopWords = null) {
  // Validate inputs
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

  const fetchLimit = stopWords ? limit * 5 : limit;
  const results = await allAsync(`
    SELECT word, count
    FROM word_stats
    WHERE guild_id = ? AND user_id = ?
    ORDER BY count DESC
    LIMIT ?
  `, [guildId, userId, fetchLimit]);

  if (stopWords) {
    return results.filter(r => !stopWords.has(r.word)).slice(0, limit);
  }
  return results;
}

// Get server-wide top words (weekly)
export async function getWeeklyTopWords(guildId, limit = 10) {
  validateSnowflake(guildId, 'Guild ID');

  return await allAsync(`
    SELECT word, SUM(count) as total_count
    FROM word_stats_weekly
    WHERE guild_id = ?
    GROUP BY word
    ORDER BY total_count DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Get top users by word count (weekly)
export async function getWeeklyTopUsers(guildId, limit = 5) {
  validateSnowflake(guildId, 'Guild ID');

  return await allAsync(`
    SELECT user_id, SUM(count) as total_words
    FROM word_stats_weekly
    WHERE guild_id = ?
    GROUP BY user_id
    ORDER BY total_words DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Reset weekly stats for a guild
export async function resetWeeklyStats(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM word_stats_weekly WHERE guild_id = ?`, [guildId]);
}

// Get total word count for guild (weekly)
export async function getWeeklyTotalCount(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  const result = await allAsync(`
    SELECT SUM(count) as total
    FROM word_stats_weekly
    WHERE guild_id = ?
  `, [guildId]);
  return result[0]?.total || 0;
}

// Get all guilds with stats
export async function getAllGuilds() {
  return await allAsync(`
    SELECT
      ws.guild_id,
      COUNT(DISTINCT ws.user_id) as user_count,
      COUNT(DISTINCT ws.word) as unique_words,
      SUM(ws.count) as total_words,
      gs.recap_channel_id,
      gs.recap_day,
      gs.recap_hour
    FROM word_stats ws
    LEFT JOIN guild_settings gs ON ws.guild_id = gs.guild_id
    GROUP BY ws.guild_id
    ORDER BY total_words DESC
  `);
}

// Get all stats for export
export async function exportAllStats() {
  const allTime = await allAsync(`SELECT guild_id, user_id, word, count FROM word_stats`);
  const weekly = await allAsync(`SELECT guild_id, user_id, word, count FROM word_stats_weekly`);
  return { allTime, weekly };
}

// Import stats (clears existing and imports new)
export async function importStats(data) {
  await runAsync(`DELETE FROM word_stats`);
  await runAsync(`DELETE FROM word_stats_weekly`);

  // Import all-time stats
  if (data.allTime && data.allTime.length > 0) {
    for (const row of data.allTime) {
      await runAsync(`
        INSERT INTO word_stats (guild_id, user_id, word, count)
        VALUES (?, ?, ?, ?)
      `, [row.guild_id, row.user_id, row.word, row.count]);
    }
  }

  // Import weekly stats
  if (data.weekly && data.weekly.length > 0) {
    for (const row of data.weekly) {
      await runAsync(`
        INSERT INTO word_stats_weekly (guild_id, user_id, word, count)
        VALUES (?, ?, ?, ?)
      `, [row.guild_id, row.user_id, row.word, row.count]);
    }
  }
}

// Clear all stats for a guild
export async function clearGuildStats(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM word_stats WHERE guild_id = ?`, [guildId]);
  await runAsync(`DELETE FROM word_stats_weekly WHERE guild_id = ?`, [guildId]);
}

// Get database file path
export function getDbPath() {
  return DB_FILE;
}

// Get guild settings
export async function getGuildSettings(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  const results = await allAsync(`
    SELECT * FROM guild_settings WHERE guild_id = ?
  `, [guildId]);
  return results[0] || null;
}

// Set recap channel and schedule for a guild
export async function setRecapChannel(guildId, channelId, day = 0, hour = 12) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(channelId, 'Channel ID');

  await runAsync(`
    INSERT INTO guild_settings (guild_id, recap_channel_id, recap_day, recap_hour, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(guild_id) DO UPDATE SET
      recap_channel_id = ?,
      recap_day = ?,
      recap_hour = ?,
      updated_at = CURRENT_TIMESTAMP
  `, [guildId, channelId, day, hour, channelId, day, hour]);
}

// Get all guilds with recap channels configured
export async function getAllRecapChannels() {
  return await allAsync(`
    SELECT guild_id, recap_channel_id, recap_day, recap_hour
    FROM guild_settings
    WHERE recap_channel_id IS NOT NULL
  `);
}

// Initialize guild settings (called when bot joins a server)
export async function initializeGuildSettings(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  // Check if settings already exist
  const existing = await getGuildSettings(guildId);
  if (existing) {
    return; // Already initialized, don't change anything
  }

  // Check if server has existing word stats data (for migration)
  const hasWordStats = await allAsync(`
    SELECT COUNT(*) as count FROM word_stats WHERE guild_id = ? LIMIT 1
  `, [guildId]);

  // Check if server has existing Spotify stats data
  // We need to check the spotify_listens table from the other database
  let hasSpotifyStatsCount = 0;
  try {
    const spotifyDbPath = path.join(process.cwd(), 'config', 'spotify-stats.db');
    const spotifyDb = new sqlite3.Database(spotifyDbPath);
    const spotifyStats = await new Promise((resolve, reject) => {
      spotifyDb.get(`SELECT COUNT(*) as count FROM spotify_listens WHERE guild_id = ? LIMIT 1`, [guildId], (err, row) => {
        spotifyDb.close();
        if (err) reject(err);
        else resolve(row);
      });
    });
    hasSpotifyStatsCount = spotifyStats?.count || 0;
  } catch (error) {
    // Spotify DB might not exist yet, that's okay
    console.log(`[Migration] Could not check Spotify stats for guild ${guildId}:`, error.message);
  }

  // Auto-enable features if existing data is found
  const wordEnabled = hasWordStats[0]?.count > 0 ? 1 : 0;
  const spotifyEnabled = hasSpotifyStatsCount > 0 ? 1 : 0;

  // Use INSERT OR IGNORE to avoid conflicts, only insert basic columns
  // The migration will add announcement columns if they don't exist
  await runAsync(`
    INSERT OR IGNORE INTO guild_settings (guild_id, word_tracking_enabled, spotify_tracking_enabled)
    VALUES (?, ?, ?)
  `, [guildId, wordEnabled, spotifyEnabled]);

  if (wordEnabled || spotifyEnabled) {
    console.log(`[Migration] Auto-enabled features for guild ${guildId}: Word=${wordEnabled ? 'Yes' : 'No'}, Spotify=${spotifyEnabled ? 'Yes' : 'No'}`);
  }
}

// Update feature flags for a guild
export async function updateFeatureFlags(guildId, wordTracking, spotifyTracking, announcements = null) {
  validateSnowflake(guildId, 'Guild ID');

  // Ensure guild settings exist first
  await initializeGuildSettings(guildId);

  // If announcements parameter not provided, don't update it
  if (announcements === null) {
    await runAsync(`
      UPDATE guild_settings
      SET word_tracking_enabled = ?,
          spotify_tracking_enabled = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE guild_id = ?
    `, [wordTracking ? 1 : 0, spotifyTracking ? 1 : 0, guildId]);
  } else {
    await runAsync(`
      UPDATE guild_settings
      SET word_tracking_enabled = ?,
          spotify_tracking_enabled = ?,
          announcements_enabled = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE guild_id = ?
    `, [wordTracking ? 1 : 0, spotifyTracking ? 1 : 0, announcements ? 1 : 0, guildId]);
  }
}

// Check if a feature is enabled for a guild
export async function isFeatureEnabled(guildId, feature) {
  validateSnowflake(guildId, 'Guild ID');

  const settings = await getGuildSettings(guildId);
  if (!settings) return false; // Default to disabled

  if (feature === 'word_tracking') {
    return settings.word_tracking_enabled === 1;
  } else if (feature === 'spotify_tracking') {
    return settings.spotify_tracking_enabled === 1;
  } else if (feature === 'announcements') {
    return settings.announcements_enabled === 1;
  }

  return false;
}

// Set announcement channel for a guild
export async function setAnnouncementChannel(guildId, channelId) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(channelId, 'Channel ID');

  await runAsync(`
    INSERT INTO guild_settings (guild_id, announcement_channel_id, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(guild_id) DO UPDATE SET
      announcement_channel_id = ?,
      updated_at = CURRENT_TIMESTAMP
  `, [guildId, channelId, channelId]);
}

// Get all guilds with announcements enabled and channel configured
export async function getAllAnnouncementChannels() {
  return await allAsync(`
    SELECT guild_id, announcement_channel_id
    FROM guild_settings
    WHERE announcement_channel_id IS NOT NULL AND announcements_enabled = 1
  `);
}

// GDPR: Delete ALL data for a user across all guilds
export async function deleteAllUserWordData(userId) {
  validateSnowflake(userId, 'User ID');

  // Delete from all-time word stats
  await runAsync(`DELETE FROM word_stats WHERE user_id = ?`, [userId]);

  // Delete from weekly word stats
  await runAsync(`DELETE FROM word_stats_weekly WHERE user_id = ?`, [userId]);

  console.log(`[GDPR] Deleted all word data for user ${userId}`);
}

export default db;
