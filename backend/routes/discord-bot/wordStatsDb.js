import sqlite3 from 'sqlite3';
import path from 'path';
import { validateSnowflake, validateWord } from './validation.js';

const DB_FILE = path.join(process.cwd(), 'config', 'word-stats.db');
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS word_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    word TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(guild_id, user_id, word)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS word_stats_weekly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    word TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(guild_id, user_id, word)
  )`);

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

  db.run(`CREATE INDEX IF NOT EXISTS idx_word_stats_guild ON word_stats(guild_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_word_stats_weekly_guild ON word_stats_weekly(guild_id)`);

  // Add missing columns to guild_settings if they don't exist
  db.all(`PRAGMA table_info(guild_settings)`, (err, columns) => {
    if (err) {
      console.error('[Migration] Error checking guild_settings columns:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);
    const migrations = [];

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

    if (!columnNames.includes('game_tracking_enabled')) {
      migrations.push({
        column: 'game_tracking_enabled',
        sql: 'ALTER TABLE guild_settings ADD COLUMN game_tracking_enabled INTEGER DEFAULT 0'
      });
    }

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

export async function incrementWordCount(guildId, userId, word) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

  try {
    validateWord(word);
  } catch (error) {
    console.warn(`[Word Validation] Skipping invalid word: ${error.message}`);
    return;
  }

  await runAsync(`
    INSERT INTO word_stats (guild_id, user_id, word, count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(guild_id, user_id, word) DO UPDATE SET count = count + 1
  `, [guildId, userId, word]);

  await runAsync(`
    INSERT INTO word_stats_weekly (guild_id, user_id, word, count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(guild_id, user_id, word) DO UPDATE SET count = count + 1
  `, [guildId, userId, word]);
}

export async function getTopWords(guildId, limit = 10, stopWords = null) {
  validateSnowflake(guildId, 'Guild ID');

  // Fetch extra results to account for stop word filtering
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

export async function getTopWordsForUser(guildId, userId, limit = 10, stopWords = null) {
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

export async function getWeeklyTopWords(guildId, limit = 10, stopWords = null) {
  validateSnowflake(guildId, 'Guild ID');
  const fetchLimit = stopWords ? limit * 5 : limit;

  const results = await allAsync(`
    SELECT word, SUM(count) as total_count
    FROM word_stats_weekly
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

export async function resetWeeklyStats(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM word_stats_weekly WHERE guild_id = ?`, [guildId]);
}

export async function getWeeklyTotalCount(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  const result = await allAsync(`
    SELECT SUM(count) as total
    FROM word_stats_weekly
    WHERE guild_id = ?
  `, [guildId]);
  return result[0]?.total || 0;
}

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

export async function exportAllStats() {
  const allTime = await allAsync(`SELECT guild_id, user_id, word, count FROM word_stats`);
  const weekly = await allAsync(`SELECT guild_id, user_id, word, count FROM word_stats_weekly`);
  return { allTime, weekly };
}

export async function importStats(data) {
  await runAsync(`DELETE FROM word_stats`);
  await runAsync(`DELETE FROM word_stats_weekly`);

  if (data.allTime && data.allTime.length > 0) {
    for (const row of data.allTime) {
      await runAsync(`
        INSERT INTO word_stats (guild_id, user_id, word, count)
        VALUES (?, ?, ?, ?)
      `, [row.guild_id, row.user_id, row.word, row.count]);
    }
  }

  if (data.weekly && data.weekly.length > 0) {
    for (const row of data.weekly) {
      await runAsync(`
        INSERT INTO word_stats_weekly (guild_id, user_id, word, count)
        VALUES (?, ?, ?, ?)
      `, [row.guild_id, row.user_id, row.word, row.count]);
    }
  }
}

export async function clearGuildStats(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM word_stats WHERE guild_id = ?`, [guildId]);
  await runAsync(`DELETE FROM word_stats_weekly WHERE guild_id = ?`, [guildId]);
}

export function getDbPath() {
  return DB_FILE;
}

export async function getGuildSettings(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  const results = await allAsync(`
    SELECT * FROM guild_settings WHERE guild_id = ?
  `, [guildId]);
  return results[0] || null;
}

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

export async function getAllRecapChannels() {
  return await allAsync(`
    SELECT guild_id, recap_channel_id, recap_day, recap_hour
    FROM guild_settings
    WHERE recap_channel_id IS NOT NULL
  `);
}

export async function initializeGuildSettings(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  const existing = await getGuildSettings(guildId);
  if (existing) {
    return;
  }

  // Auto-enable features if guild already has data (for migration)
  const hasWordStats = await allAsync(`
    SELECT COUNT(*) as count FROM word_stats WHERE guild_id = ? LIMIT 1
  `, [guildId]);

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
    console.log(`[Migration] Could not check Spotify stats for guild ${guildId}:`, error.message);
  }
  const wordEnabled = hasWordStats[0]?.count > 0 ? 1 : 0;
  const spotifyEnabled = hasSpotifyStatsCount > 0 ? 1 : 0;

  await runAsync(`
    INSERT OR IGNORE INTO guild_settings (guild_id, word_tracking_enabled, spotify_tracking_enabled)
    VALUES (?, ?, ?)
  `, [guildId, wordEnabled, spotifyEnabled]);

  if (wordEnabled || spotifyEnabled) {
    console.log(`[Migration] Auto-enabled features for guild ${guildId}: Word=${wordEnabled ? 'Yes' : 'No'}, Spotify=${spotifyEnabled ? 'Yes' : 'No'}`);
  }
}

export async function updateFeatureFlags(guildId, wordTracking, spotifyTracking, gameTracking = null, announcements = null) {
  validateSnowflake(guildId, 'Guild ID');

  await initializeGuildSettings(guildId);
  const fields = ['word_tracking_enabled = ?', 'spotify_tracking_enabled = ?'];
  const values = [wordTracking ? 1 : 0, spotifyTracking ? 1 : 0];

  if (gameTracking !== null) {
    fields.push('game_tracking_enabled = ?');
    values.push(gameTracking ? 1 : 0);
  }

  if (announcements !== null) {
    fields.push('announcements_enabled = ?');
    values.push(announcements ? 1 : 0);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(guildId);

  await runAsync(`
    UPDATE guild_settings
    SET ${fields.join(', ')}
    WHERE guild_id = ?
  `, values);
}

export async function isFeatureEnabled(guildId, feature) {
  validateSnowflake(guildId, 'Guild ID');

  const settings = await getGuildSettings(guildId);
  if (!settings) return false;

  if (feature === 'word_tracking') {
    return settings.word_tracking_enabled === 1;
  } else if (feature === 'spotify_tracking') {
    return settings.spotify_tracking_enabled === 1;
  } else if (feature === 'announcements') {
    return settings.announcements_enabled === 1;
  }

  return false;
}

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

export async function getAllAnnouncementChannels() {
  return await allAsync(`
    SELECT guild_id, announcement_channel_id
    FROM guild_settings
    WHERE announcement_channel_id IS NOT NULL AND announcements_enabled = 1
  `);
}

export async function deleteAllUserWordData(userId) {
  validateSnowflake(userId, 'User ID');

  await runAsync(`DELETE FROM word_stats WHERE user_id = ?`, [userId]);
  await runAsync(`DELETE FROM word_stats_weekly WHERE user_id = ?`, [userId]);

  console.log(`[GDPR] Deleted all word data for user ${userId}`);
}

export default db;
