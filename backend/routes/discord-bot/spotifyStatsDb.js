import sqlite3 from 'sqlite3';
import path from 'path';
import {
  validateSnowflake,
  validateUsername,
  validateTrackName,
  validateArtistName,
  validateAlbumName,
  validateSpotifyTrackId,
  validateDuration
} from './validation.js';

const DB_FILE = path.join(process.cwd(), 'config', 'spotify-stats.db');
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
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

  // Composite key allows same user to be tracked in multiple servers
  db.run(`CREATE TABLE IF NOT EXISTS tracked_users (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    username TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME,
    PRIMARY KEY (user_id, guild_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS global_optout (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    opted_out_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS global_optin (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    opted_in_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_guild ON spotify_listens(guild_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_user ON spotify_listens(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_weekly_guild ON spotify_listens_weekly(guild_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_spotify_listens_track ON spotify_listens(spotify_track_id)`);
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

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export async function addTrackedUser(userId, guildId, username) {
  validateSnowflake(userId, 'User ID');
  validateSnowflake(guildId, 'Guild ID');
  const sanitizedUsername = validateUsername(username);

  await runAsync(`
    INSERT OR REPLACE INTO tracked_users (user_id, guild_id, username, last_seen)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `, [userId, guildId, sanitizedUsername]);
}

export async function removeTrackedUser(userId, guildId) {
  validateSnowflake(userId, 'User ID');
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM tracked_users WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
}

export async function getTrackedUsers(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  return await allAsync(`SELECT * FROM tracked_users WHERE guild_id = ? ORDER BY username`, [guildId]);
}

export async function getGuildsTrackingUser(userId) {
  validateSnowflake(userId, 'User ID');

  return await allAsync(`SELECT guild_id FROM tracked_users WHERE user_id = ?`, [userId]);
}

export async function isUserTracked(userId, guildId) {
  validateSnowflake(userId, 'User ID');
  validateSnowflake(guildId, 'Guild ID');

  const result = await getAsync(`SELECT user_id FROM tracked_users WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
  return result !== undefined;
}

export async function isUserTrackedGlobally(userId) {
  validateSnowflake(userId, 'User ID');

  const result = await getAsync(`SELECT user_id FROM tracked_users WHERE user_id = ? LIMIT 1`, [userId]);
  return result !== undefined;
}

export async function setGlobalOptOut(userId, username) {
  validateSnowflake(userId, 'User ID');
  const sanitizedUsername = validateUsername(username);

  await runAsync(`
    INSERT INTO global_optout (user_id, username)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET opted_out_at = CURRENT_TIMESTAMP
  `, [userId, sanitizedUsername]);
}

export async function isGloballyOptedOut(userId) {
  validateSnowflake(userId, 'User ID');

  const result = await getAsync(`SELECT user_id FROM global_optout WHERE user_id = ?`, [userId]);
  return result !== undefined;
}

export async function removeGlobalOptOut(userId) {
  validateSnowflake(userId, 'User ID');

  await runAsync(`DELETE FROM global_optout WHERE user_id = ?`, [userId]);
}

export async function isGloballyOptedIn(userId) {
  validateSnowflake(userId, 'User ID');

  const result = await getAsync(`SELECT user_id FROM global_optin WHERE user_id = ?`, [userId]);
  return result !== undefined;
}

export async function migrateOptInToOptOut() {
  try {
    const optedInUsers = await allAsync(`SELECT user_id, username FROM global_optin`);

    if (optedInUsers.length > 0) {
      console.log(`[Migration] Found ${optedInUsers.length} users with explicit opt-in. They will continue to be tracked (not added to opt-out list).`);
    }

    return true;
  } catch (error) {
    console.error('[Migration] Error during opt-in to opt-out migration:', error);
    return false;
  }
}

export async function logListen(guildId, userId, trackName, artist, album, spotifyTrackId, durationMs) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');
  const sanitizedTrack = validateTrackName(trackName);
  const sanitizedArtist = validateArtistName(artist);
  const sanitizedAlbum = validateAlbumName(album);
  const sanitizedTrackId = validateSpotifyTrackId(spotifyTrackId);
  const sanitizedDuration = validateDuration(durationMs);

  const params = [guildId, userId, sanitizedTrack, sanitizedArtist, sanitizedAlbum, sanitizedTrackId, sanitizedDuration];

  await runAsync(`
    INSERT INTO spotify_listens (guild_id, user_id, track_name, artist, album, spotify_track_id, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, params);

  await runAsync(`
    INSERT INTO spotify_listens_weekly (guild_id, user_id, track_name, artist, album, spotify_track_id, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, params);
}

export async function logListenToAllGuilds(userId, trackName, artist, album, spotifyTrackId, durationMs) {
  const guilds = await getGuildsTrackingUser(userId);

  for (const guild of guilds) {
    await logListen(guild.guild_id, userId, trackName, artist, album, spotifyTrackId, durationMs);
  }
}

export async function getTopTracks(guildId, limit = 10) {
  validateSnowflake(guildId, 'Guild ID');

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

export async function getTopArtists(guildId, limit = 10) {
  validateSnowflake(guildId, 'Guild ID');

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

export async function getTopTracksForUser(guildId, userId, limit = 10) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

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

export async function getTopArtistsForUser(guildId, userId, limit = 10) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

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

export async function getWeeklyTopTracks(guildId, limit = 10) {
  validateSnowflake(guildId, 'Guild ID');

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

export async function getWeeklyTopArtists(guildId, limit = 10) {
  validateSnowflake(guildId, 'Guild ID');

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

export async function getWeeklyTotalCount(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  const result = await getAsync(`
    SELECT COUNT(*) as total
    FROM spotify_listens_weekly
    WHERE guild_id = ?
  `, [guildId]);
  return result?.total || 0;
}

export async function getWeeklyTopListeners(guildId, limit = 5) {
  validateSnowflake(guildId, 'Guild ID');

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

export async function resetWeeklyStats(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM spotify_listens_weekly WHERE guild_id = ?`, [guildId]);
}

export async function getUserStats(guildId, userId) {
  validateSnowflake(guildId, 'Guild ID');
  validateSnowflake(userId, 'User ID');

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

export async function getGlobalUserStats(userId) {
  validateSnowflake(userId, 'User ID');

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

export async function getMusicCompatibility(guildId, userId1, userId2) {
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
    compatibilityPercent: Math.min(compatibilityPercent, 100),
  };
}

export async function clearGuildStats(guildId) {
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM spotify_listens WHERE guild_id = ?`, [guildId]);
  await runAsync(`DELETE FROM spotify_listens_weekly WHERE guild_id = ?`, [guildId]);
}

export async function removeAllTrackedUsersForGuild(guildId) {
  await runAsync(`DELETE FROM tracked_users WHERE guild_id = ?`, [guildId]);
}

export async function removeUserFromGuild(userId, guildId) {
  validateSnowflake(userId, 'User ID');
  validateSnowflake(guildId, 'Guild ID');

  await runAsync(`DELETE FROM tracked_users WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
}

export async function deleteAllUserData(userId) {
  validateSnowflake(userId, 'User ID');

  await runAsync(`DELETE FROM spotify_listens WHERE user_id = ?`, [userId]);
  await runAsync(`DELETE FROM spotify_listens_weekly WHERE user_id = ?`, [userId]);
  await runAsync(`DELETE FROM tracked_users WHERE user_id = ?`, [userId]);
  await runAsync(`DELETE FROM global_optout WHERE user_id = ?`, [userId]);
  await runAsync(`DELETE FROM global_optin WHERE user_id = ?`, [userId]);

  console.log(`[GDPR] Deleted all Spotify data for user ${userId}`);
}

export function getDbPath() {
  return DB_FILE;
}

export async function getOptedOutUsers() {
  return await allAsync(`SELECT user_id, username, opted_out_at FROM global_optout ORDER BY opted_out_at DESC`);
}

export async function getAllGuildsWithStats() {
  return await allAsync(`
    SELECT
      guild_id,
      COUNT(DISTINCT user_id) as user_count,
      COUNT(*) as total_listens,
      COUNT(DISTINCT track_name || artist) as unique_tracks
    FROM spotify_listens
    GROUP BY guild_id
    ORDER BY total_listens DESC
  `);
}

export async function getAllUsersWithStats() {
  return await allAsync(`
    SELECT
      user_id,
      COUNT(DISTINCT guild_id) as guild_count,
      COUNT(*) as total_listens,
      COUNT(DISTINCT track_name || artist) as unique_tracks,
      MAX(started_at) as last_listen
    FROM spotify_listens
    GROUP BY user_id
    ORDER BY total_listens DESC
  `);
}

export async function exportAllStats() {
  const allTime = await allAsync(`SELECT * FROM spotify_listens`);
  const weekly = await allAsync(`SELECT * FROM spotify_listens_weekly`);
  const tracked = await allAsync(`SELECT * FROM tracked_users`);
  const optedOut = await allAsync(`SELECT * FROM global_optout`);
  return { allTime, weekly, tracked, optedOut };
}

export default db;
