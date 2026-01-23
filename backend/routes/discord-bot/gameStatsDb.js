import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateSnowflake, validateText, validateLimit } from './validation.js';

const dbPath = path.join(process.cwd(), 'config', 'game-stats.db');
const db = new sqlite3.Database(dbPath);

// Promisified helpers
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
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

// Initialize database
db.serialize(() => {
  // All-time game sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      game_name TEXT NOT NULL,
      game_id TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration_seconds INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Weekly game sessions (reset on recap)
  db.run(`
    CREATE TABLE IF NOT EXISTS game_sessions_weekly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      game_name TEXT NOT NULL,
      game_id TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration_seconds INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Global opt-out
  db.run(`
    CREATE TABLE IF NOT EXISTS global_optout_gaming (
      user_id TEXT PRIMARY KEY,
      opted_out_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Indexes for performance
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_game_sessions_guild_user
    ON game_sessions(guild_id, user_id)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_game_sessions_guild_game
    ON game_sessions(guild_id, game_name)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_game_sessions_weekly_guild_user
    ON game_sessions_weekly(guild_id, user_id)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_game_sessions_weekly_guild_game
    ON game_sessions_weekly(guild_id, game_name)
  `);
});

// Start a new game session
export async function startGameSession(guildId, userId, gameName, gameId = null) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');
  const sanitizedGameName = validateText(gameName, 'Game name', 200);
  const sanitizedGameId = gameId ? validateText(gameId, 'Game ID', 100) : null;

  const startTime = Math.floor(Date.now() / 1000);

  // Insert into both all-time and weekly
  const result = await runAsync(`
    INSERT INTO game_sessions (guild_id, user_id, game_name, game_id, start_time)
    VALUES (?, ?, ?, ?, ?)
  `, [guildId, userId, sanitizedGameName, sanitizedGameId, startTime]);

  await runAsync(`
    INSERT INTO game_sessions_weekly (guild_id, user_id, game_name, game_id, start_time)
    VALUES (?, ?, ?, ?, ?)
  `, [guildId, userId, sanitizedGameName, sanitizedGameId, startTime]);

  return result.lastID;
}

// End an active game session
export async function endGameSession(guildId, userId, sessionId = null) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

  const endTime = Math.floor(Date.now() / 1000);

  // End the most recent active session for this user
  if (sessionId) {
    await runAsync(`
      UPDATE game_sessions
      SET end_time = ?,
          duration_seconds = ? - start_time
      WHERE guild_id = ?
        AND user_id = ?
        AND id = ?
        AND end_time IS NULL
    `, [endTime, endTime, guildId, userId, sessionId]);

    await runAsync(`
      UPDATE game_sessions_weekly
      SET end_time = ?,
          duration_seconds = ? - start_time
      WHERE guild_id = ?
        AND user_id = ?
        AND id = ?
        AND end_time IS NULL
    `, [endTime, endTime, guildId, userId, sessionId]);
  } else {
    await runAsync(`
      UPDATE game_sessions
      SET end_time = ?,
          duration_seconds = ? - start_time
      WHERE id = (
        SELECT id FROM game_sessions
        WHERE guild_id = ?
          AND user_id = ?
          AND end_time IS NULL
        ORDER BY start_time DESC
        LIMIT 1
      )
    `, [endTime, endTime, guildId, userId]);

    await runAsync(`
      UPDATE game_sessions_weekly
      SET end_time = ?,
          duration_seconds = ? - start_time
      WHERE id = (
        SELECT id FROM game_sessions_weekly
        WHERE guild_id = ?
          AND user_id = ?
          AND end_time IS NULL
        ORDER BY start_time DESC
        LIMIT 1
      )
    `, [endTime, endTime, guildId, userId]);
  }
}

// Get active session for a user
export async function getActiveSession(guildId, userId) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

  return await getAsync(`
    SELECT * FROM game_sessions
    WHERE guild_id = ?
      AND user_id = ?
      AND end_time IS NULL
    ORDER BY start_time DESC
    LIMIT 1
  `, [guildId, userId]);
}

// Get top games by hours played
export async function getTopGames(guildId, limit = 10, weekly = false) {
  validateSnowflake(guildId, 'Guild ID');
  validateLimit(limit);

  const table = weekly ? 'game_sessions_weekly' : 'game_sessions';

  return await allAsync(`
    SELECT
      game_name,
      SUM(duration_seconds) as total_seconds,
      COUNT(*) as session_count,
      COUNT(DISTINCT user_id) as unique_players
    FROM ${table}
    WHERE guild_id = ?
      AND end_time IS NOT NULL
    GROUP BY game_name
    ORDER BY total_seconds DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Get top gamers by hours played
export async function getTopGamers(guildId, limit = 10, weekly = false) {
  validateSnowflake(guildId, 'Guild ID');
  validateLimit(limit);

  const table = weekly ? 'game_sessions_weekly' : 'game_sessions';

  return await allAsync(`
    SELECT
      user_id,
      SUM(duration_seconds) as total_seconds,
      COUNT(*) as session_count,
      COUNT(DISTINCT game_name) as unique_games
    FROM ${table}
    WHERE guild_id = ?
      AND end_time IS NOT NULL
    GROUP BY user_id
    ORDER BY total_seconds DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Get user's top games
export async function getUserTopGames(guildId, userId, limit = 10, weekly = false) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');
  validateLimit(limit);

  const table = weekly ? 'game_sessions_weekly' : 'game_sessions';

  return await allAsync(`
    SELECT
      game_name,
      SUM(duration_seconds) as total_seconds,
      COUNT(*) as session_count
    FROM ${table}
    WHERE guild_id = ?
      AND user_id = ?
      AND end_time IS NOT NULL
    GROUP BY game_name
    ORDER BY total_seconds DESC
    LIMIT ?
  `, [guildId, userId, limit]);
}

// Get user stats summary
export async function getUserStats(guildId, userId, weekly = false) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

  const table = weekly ? 'game_sessions_weekly' : 'game_sessions';

  return await getAsync(`
    SELECT
      COUNT(*) as total_sessions,
      COUNT(DISTINCT game_name) as unique_games,
      SUM(duration_seconds) as total_seconds,
      AVG(duration_seconds) as avg_session_seconds
    FROM ${table}
    WHERE guild_id = ?
      AND user_id = ?
      AND end_time IS NOT NULL
  `, [guildId, userId]);
}

// Get guild stats summary
export async function getGuildStats(guildId, weekly = false) {
  validateSnowflake(guildId, 'Guild ID');

  const table = weekly ? 'game_sessions_weekly' : 'game_sessions';

  return await getAsync(`
    SELECT
      COUNT(*) as total_sessions,
      COUNT(DISTINCT user_id) as unique_players,
      COUNT(DISTINCT game_name) as unique_games,
      SUM(duration_seconds) as total_seconds,
      AVG(duration_seconds) as avg_session_seconds
    FROM ${table}
    WHERE guild_id = ?
      AND end_time IS NOT NULL
  `, [guildId]);
}

// Clear weekly stats
export async function clearWeeklyStats(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  return await runAsync('DELETE FROM game_sessions_weekly WHERE guild_id = ?', [guildId]);
}

// Opt-out management
export function optOutUser(userId) {
  validateSnowflake(userId, 'User ID');

  return runAsync(`
    INSERT OR REPLACE INTO global_optout_gaming (user_id)
    VALUES (?)
  `, [userId]);
}

export function optInUser(userId) {
  validateSnowflake(userId, 'User ID');

  return runAsync('DELETE FROM global_optout_gaming WHERE user_id = ?', [userId]);
}

export function isUserOptedOut(userId) {
  validateSnowflake(userId, 'User ID');

  return new Promise((resolve, reject) => {
    db.get('SELECT user_id FROM global_optout_gaming WHERE user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row !== undefined);
    });
  });
}

// GDPR: Delete all user data
export async function deleteAllUserData(userId) {
  validateSnowflake(userId, 'User ID');

  await runAsync('DELETE FROM game_sessions WHERE user_id = ?', [userId]);
  await runAsync('DELETE FROM game_sessions_weekly WHERE user_id = ?', [userId]);
  await runAsync('DELETE FROM global_optout_gaming WHERE user_id = ?', [userId]);
}

// Export all data
export async function exportAllData() {
  const sessions = await allAsync('SELECT * FROM game_sessions');
  const sessionsWeekly = await allAsync('SELECT * FROM game_sessions_weekly');
  const optouts = await allAsync('SELECT * FROM global_optout_gaming');

  return {
    game_sessions: sessions,
    game_sessions_weekly: sessionsWeekly,
    global_optout_gaming: optouts,
    exported_at: new Date().toISOString(),
  };
}

// Delete all guild data
export async function deleteGuildData(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  await runAsync('DELETE FROM game_sessions WHERE guild_id = ?', [guildId]);
  await runAsync('DELETE FROM game_sessions_weekly WHERE guild_id = ?', [guildId]);
}

// End all active sessions (for bot restart)
export async function endAllActiveSessions() {
  const endTime = Math.floor(Date.now() / 1000);

  await runAsync(`
    UPDATE game_sessions
    SET end_time = ?,
        duration_seconds = ? - start_time
    WHERE end_time IS NULL
  `, [endTime, endTime]);

  await runAsync(`
    UPDATE game_sessions_weekly
    SET end_time = ?,
        duration_seconds = ? - start_time
    WHERE end_time IS NULL
  `, [endTime, endTime]);
}

// Get database path for admin panel
export function getDbPath() {
  return dbPath;
}

// Get user's global gaming stats (across all guilds)
export async function getGlobalUserStats(userId) {
  validateSnowflake(userId, 'User ID');

  return await getAsync(`
    SELECT
      COUNT(*) as total_sessions,
      COUNT(DISTINCT game_name) as unique_games,
      SUM(duration_seconds) as total_seconds,
      AVG(duration_seconds) as avg_session_seconds
    FROM game_sessions
    WHERE user_id = ?
      AND end_time IS NOT NULL
  `, [userId]);
}

// Get user's top games globally (across all guilds)
export async function getGlobalTopGamesForUser(userId, limit = 10) {
  validateSnowflake(userId, 'User ID');
  validateLimit(limit);

  return await allAsync(`
    SELECT
      game_name,
      SUM(duration_seconds) as total_seconds,
      COUNT(*) as session_count
    FROM game_sessions
    WHERE user_id = ?
      AND end_time IS NOT NULL
    GROUP BY game_name
    ORDER BY total_seconds DESC
    LIMIT ?
  `, [userId, limit]);
}
