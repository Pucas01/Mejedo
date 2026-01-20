import sqlite3 from 'sqlite3';
import path from 'path';

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create indexes for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_word_stats_guild ON word_stats(guild_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_word_stats_weekly_guild ON word_stats_weekly(guild_id)`);
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
  await runAsync(`DELETE FROM word_stats_weekly WHERE guild_id = ?`, [guildId]);
}

// Get total word count for guild (weekly)
export async function getWeeklyTotalCount(guildId) {
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
  await runAsync(`DELETE FROM word_stats WHERE guild_id = ?`, [guildId]);
  await runAsync(`DELETE FROM word_stats_weekly WHERE guild_id = ?`, [guildId]);
}

// Get database file path
export function getDbPath() {
  return DB_FILE;
}

// Get guild settings
export async function getGuildSettings(guildId) {
  const results = await allAsync(`
    SELECT * FROM guild_settings WHERE guild_id = ?
  `, [guildId]);
  return results[0] || null;
}

// Set recap channel and schedule for a guild
export async function setRecapChannel(guildId, channelId, day = 0, hour = 12) {
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
    SELECT guild_id, recap_channel_id
    FROM guild_settings
    WHERE recap_channel_id IS NOT NULL
  `);
}

export default db;
