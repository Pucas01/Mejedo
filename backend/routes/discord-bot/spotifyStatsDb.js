import sqlite3 from 'sqlite3';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'config', 'spotify-stats.db');
const db = new sqlite3.Database(DB_FILE);

// Create tables
db.serialize(() => {
  // All-time Spotify listening stats
  db.run(`CREATE TABLE IF NOT EXISTS spotify_listens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    track_name TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    spotify_track_id TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER
  )`);

  // Weekly listening stats (for recap)
  db.run(`CREATE TABLE IF NOT EXISTS spotify_listens_weekly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    track_name TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    spotify_track_id TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER
  )`);

  // Track which users we're actively tracking (for privacy/opt-in)
  // Composite key allows same user to be tracked in multiple servers
  db.run(`CREATE TABLE IF NOT EXISTS tracked_users (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    username TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME,
    PRIMARY KEY (user_id, guild_id)
  )`);

  // Global opt-in tracking (users who want to be automatically tracked in all servers)
  db.run(`CREATE TABLE IF NOT EXISTS global_optin (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    opted_in_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create indexes for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_guild ON spotify_listens(guild_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_user ON spotify_listens(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_weekly_guild ON spotify_listens_weekly(guild_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_track ON spotify_listens(spotify_track_id)`);
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

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Add a user to tracking list for a specific guild
export async function addTrackedUser(userId, guildId, username) {
  await runAsync(`
    INSERT OR REPLACE INTO tracked_users (user_id, guild_id, username, last_seen)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `, [userId, guildId, username]);
}

// Remove a user from tracking list for a specific guild
export async function removeTrackedUser(userId, guildId) {
  await runAsync(`DELETE FROM tracked_users WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
}

// Get all tracked users for a specific guild
export async function getTrackedUsers(guildId) {
  return await allAsync(`SELECT * FROM tracked_users WHERE guild_id = ? ORDER BY username`, [guildId]);
}

// Get all guilds where a user is tracked
export async function getGuildsTrackingUser(userId) {
  return await allAsync(`SELECT guild_id FROM tracked_users WHERE user_id = ?`, [userId]);
}

// Check if user is tracked in a specific guild
export async function isUserTracked(userId, guildId) {
  const result = await getAsync(`SELECT user_id FROM tracked_users WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
  return result !== undefined;
}

// Check if user is tracked in ANY guild
export async function isUserTrackedGlobally(userId) {
  const result = await getAsync(`SELECT user_id FROM tracked_users WHERE user_id = ? LIMIT 1`, [userId]);
  return result !== undefined;
}

// Set global opt-in flag for a user
export async function setGlobalOptIn(userId, username) {
  await runAsync(`
    INSERT INTO global_optin (user_id, username)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET opted_in_at = CURRENT_TIMESTAMP
  `, [userId, username]);
}

// Check if user has globally opted in
export async function isGloballyOptedIn(userId) {
  const result = await getAsync(`SELECT user_id FROM global_optin WHERE user_id = ?`, [userId]);
  return result !== undefined;
}

// Remove global opt-in flag for a user
export async function removeGlobalOptIn(userId) {
  await runAsync(`DELETE FROM global_optin WHERE user_id = ?`, [userId]);
}

// Log a song listen to ALL guilds where the user is tracked
// This ensures the bot only tracks once globally, but all servers see the data
export async function logListenToAllGuilds(userId, trackName, artist, album, spotifyTrackId, durationMs) {
  // Get all guilds tracking this user
  const guilds = await getGuildsTrackingUser(userId);

  // Log to each guild
  for (const guild of guilds) {
    const params = [guild.guild_id, userId, trackName, artist, album, spotifyTrackId, durationMs];

    // All-time stats
    await runAsync(`
      INSERT INTO spotify_listens (guild_id, user_id, track_name, artist, album, spotify_track_id, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, params);

    // Weekly stats
    await runAsync(`
      INSERT INTO spotify_listens_weekly (guild_id, user_id, track_name, artist, album, spotify_track_id, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, params);

    // Update last_seen for this guild's tracking entry
    await runAsync(`
      UPDATE tracked_users SET last_seen = CURRENT_TIMESTAMP
      WHERE user_id = ? AND guild_id = ?
    `, [userId, guild.guild_id]);
  }
}

// Get top tracks for server (all-time)
export async function getTopTracks(guildId, limit = 10) {
  return await allAsync(`
    SELECT
      track_name,
      artist,
      album,
      COUNT(*) as play_count,
      COUNT(DISTINCT user_id) as unique_listeners
    FROM spotify_listens
    WHERE guild_id = ?
    GROUP BY track_name, artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Get top artists for server (all-time)
export async function getTopArtists(guildId, limit = 10) {
  return await allAsync(`
    SELECT
      artist,
      COUNT(*) as play_count,
      COUNT(DISTINCT user_id) as unique_listeners,
      COUNT(DISTINCT track_name) as unique_tracks
    FROM spotify_listens
    WHERE guild_id = ?
    GROUP BY artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Get top tracks for a user (all-time)
export async function getTopTracksForUser(guildId, userId, limit = 10) {
  return await allAsync(`
    SELECT
      track_name,
      artist,
      album,
      COUNT(*) as play_count
    FROM spotify_listens
    WHERE guild_id = ? AND user_id = ?
    GROUP BY track_name, artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [guildId, userId, limit]);
}

// Get top artists for a user (all-time)
export async function getTopArtistsForUser(guildId, userId, limit = 10) {
  return await allAsync(`
    SELECT
      artist,
      COUNT(*) as play_count,
      COUNT(DISTINCT track_name) as unique_tracks
    FROM spotify_listens
    WHERE guild_id = ? AND user_id = ?
    GROUP BY artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [guildId, userId, limit]);
}

// Get weekly top tracks
export async function getWeeklyTopTracks(guildId, limit = 10) {
  return await allAsync(`
    SELECT
      track_name,
      artist,
      album,
      COUNT(*) as play_count,
      COUNT(DISTINCT user_id) as unique_listeners
    FROM spotify_listens_weekly
    WHERE guild_id = ?
    GROUP BY track_name, artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Get weekly top artists
export async function getWeeklyTopArtists(guildId, limit = 10) {
  return await allAsync(`
    SELECT
      artist,
      COUNT(*) as play_count,
      COUNT(DISTINCT user_id) as unique_listeners
    FROM spotify_listens_weekly
    WHERE guild_id = ?
    GROUP BY artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Get weekly total listen count
export async function getWeeklyTotalCount(guildId) {
  const result = await getAsync(`
    SELECT COUNT(*) as total
    FROM spotify_listens_weekly
    WHERE guild_id = ?
  `, [guildId]);
  return result?.total || 0;
}

// Get most active listeners (weekly)
export async function getWeeklyTopListeners(guildId, limit = 5) {
  return await allAsync(`
    SELECT
      user_id,
      COUNT(*) as listen_count,
      COUNT(DISTINCT track_name || artist) as unique_tracks
    FROM spotify_listens_weekly
    WHERE guild_id = ?
    GROUP BY user_id
    ORDER BY listen_count DESC
    LIMIT ?
  `, [guildId, limit]);
}

// Reset weekly stats
export async function resetWeeklyStats(guildId) {
  await runAsync(`DELETE FROM spotify_listens_weekly WHERE guild_id = ?`, [guildId]);
}

// Get user's listening stats summary (guild-specific)
export async function getUserStats(guildId, userId) {
  const totalListens = await getAsync(`
    SELECT COUNT(*) as total
    FROM spotify_listens
    WHERE guild_id = ? AND user_id = ?
  `, [guildId, userId]);

  const uniqueTracks = await getAsync(`
    SELECT COUNT(DISTINCT track_name || artist) as total
    FROM spotify_listens
    WHERE guild_id = ? AND user_id = ?
  `, [guildId, userId]);

  const uniqueArtists = await getAsync(`
    SELECT COUNT(DISTINCT artist) as total
    FROM spotify_listens
    WHERE guild_id = ? AND user_id = ?
  `, [guildId, userId]);

  return {
    totalListens: totalListens?.total || 0,
    uniqueTracks: uniqueTracks?.total || 0,
    uniqueArtists: uniqueArtists?.total || 0,
  };
}

// Get user's listening stats summary (global across all guilds)
export async function getGlobalUserStats(userId) {
  const totalListens = await getAsync(`
    SELECT COUNT(*) as total
    FROM spotify_listens
    WHERE user_id = ?
  `, [userId]);

  const uniqueTracks = await getAsync(`
    SELECT COUNT(DISTINCT track_name || artist) as total
    FROM spotify_listens
    WHERE user_id = ?
  `, [userId]);

  const uniqueArtists = await getAsync(`
    SELECT COUNT(DISTINCT artist) as total
    FROM spotify_listens
    WHERE user_id = ?
  `, [userId]);

  return {
    totalListens: totalListens?.total || 0,
    uniqueTracks: uniqueTracks?.total || 0,
    uniqueArtists: uniqueArtists?.total || 0,
  };
}

// Get top tracks for a user globally (across all guilds)
export async function getGlobalTopTracksForUser(userId, limit = 10) {
  return await allAsync(`
    SELECT
      track_name,
      artist,
      album,
      COUNT(*) as play_count
    FROM spotify_listens
    WHERE user_id = ?
    GROUP BY track_name, artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [userId, limit]);
}

// Get top artists for a user globally (across all guilds)
export async function getGlobalTopArtistsForUser(userId, limit = 10) {
  return await allAsync(`
    SELECT
      artist,
      COUNT(*) as play_count,
      COUNT(DISTINCT track_name) as unique_tracks
    FROM spotify_listens
    WHERE user_id = ?
    GROUP BY artist
    ORDER BY play_count DESC
    LIMIT ?
  `, [userId, limit]);
}

// Get music compatibility between two users (shared artists/tracks)
export async function getMusicCompatibility(guildId, userId1, userId2) {
  // Get shared artists
  const sharedArtists = await allAsync(`
    SELECT
      artist,
      COUNT(*) as total_plays
    FROM spotify_listens
    WHERE guild_id = ? AND (user_id = ? OR user_id = ?)
    GROUP BY artist
    HAVING COUNT(DISTINCT user_id) = 2
    ORDER BY total_plays DESC
    LIMIT 5
  `, [guildId, userId1, userId2]);

  // Get shared tracks
  const sharedTracks = await allAsync(`
    SELECT
      track_name,
      artist,
      COUNT(*) as total_plays
    FROM spotify_listens
    WHERE guild_id = ? AND (user_id = ? OR user_id = ?)
    GROUP BY track_name, artist
    HAVING COUNT(DISTINCT user_id) = 2
    ORDER BY total_plays DESC
    LIMIT 5
  `, [guildId, userId1, userId2]);

  // Calculate compatibility percentage
  const user1Artists = await getAsync(`
    SELECT COUNT(DISTINCT artist) as total
    FROM spotify_listens
    WHERE guild_id = ? AND user_id = ?
  `, [guildId, userId1]);

  const user2Artists = await getAsync(`
    SELECT COUNT(DISTINCT artist) as total
    FROM spotify_listens
    WHERE guild_id = ? AND user_id = ?
  `, [guildId, userId2]);

  const totalUniqueArtists = user1Artists.total + user2Artists.total;
  const compatibilityPercent = totalUniqueArtists > 0
    ? Math.round((sharedArtists.length / (totalUniqueArtists / 2)) * 100)
    : 0;

  return {
    sharedArtists,
    sharedTracks,
    compatibilityPercent: Math.min(compatibilityPercent, 100), // Cap at 100%
  };
}

// Clear all stats for a guild
export async function clearGuildStats(guildId) {
  await runAsync(`DELETE FROM spotify_listens WHERE guild_id = ?`, [guildId]);
  await runAsync(`DELETE FROM spotify_listens_weekly WHERE guild_id = ?`, [guildId]);
}

// Remove all tracked users for a guild (when bot leaves)
export async function removeAllTrackedUsersForGuild(guildId) {
  await runAsync(`DELETE FROM tracked_users WHERE guild_id = ?`, [guildId]);
}

// Remove user from a specific guild (when user leaves guild)
export async function removeUserFromGuild(userId, guildId) {
  await runAsync(`DELETE FROM tracked_users WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
}

// Get database file path
export function getDbPath() {
  return DB_FILE;
}

// Export all stats
export async function exportAllStats() {
  const allTime = await allAsync(`SELECT * FROM spotify_listens`);
  const weekly = await allAsync(`SELECT * FROM spotify_listens_weekly`);
  const tracked = await allAsync(`SELECT * FROM tracked_users`);
  return { allTime, weekly, tracked };
}

export default db;
