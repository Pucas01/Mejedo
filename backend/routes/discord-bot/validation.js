/**
 * Validation utilities for Discord bot input
 */

/**
 * Validate Discord snowflake ID (user ID, guild ID, channel ID, etc.)
 * Discord snowflakes are strings of 17-20 digits
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid
 */
export function isValidSnowflake(id) {
  if (typeof id !== 'string') return false;
  // Discord snowflakes are 17-20 characters long and contain only digits
  return /^\d{17,20}$/.test(id);
}

/**
 * Validate and sanitize a Discord snowflake ID
 * @param {string} id - The ID to validate
 * @param {string} fieldName - Name of the field for error message
 * @throws {Error} - If ID is invalid
 * @returns {string} - The validated ID
 */
export function validateSnowflake(id, fieldName = 'ID') {
  if (!isValidSnowflake(id)) {
    throw new Error(`Invalid ${fieldName}: must be a valid Discord ID (17-20 digits)`);
  }
  return id;
}

/**
 * Validate and sanitize text input (track names, artist names, words, etc.)
 * @param {string} text - The text to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Name of the field for error message
 * @throws {Error} - If text is invalid
 * @returns {string} - The sanitized text
 */
export function validateText(text, maxLength = 500, fieldName = 'Text') {
  if (typeof text !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (text.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  if (text.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }

  // Remove null bytes and other control characters except newlines
  const sanitized = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate username
 * @param {string} username - The username to validate
 * @returns {string} - The sanitized username
 */
export function validateUsername(username) {
  return validateText(username, 32, 'Username');
}

/**
 * Validate track/song name
 * @param {string} trackName - The track name to validate
 * @returns {string} - The sanitized track name
 */
export function validateTrackName(trackName) {
  return validateText(trackName, 200, 'Track name');
}

/**
 * Validate artist name
 * @param {string} artistName - The artist name to validate
 * @returns {string} - The sanitized artist name
 */
export function validateArtistName(artistName) {
  return validateText(artistName, 200, 'Artist name');
}

/**
 * Validate album name
 * @param {string} albumName - The album name to validate
 * @returns {string} - The sanitized album name
 */
export function validateAlbumName(albumName) {
  if (!albumName) return null;
  return validateText(albumName, 200, 'Album name');
}

/**
 * Validate word (for word tracking)
 * @param {string} word - The word to validate
 * @returns {string} - The sanitized word
 */
export function validateWord(word) {
  if (typeof word !== 'string') {
    throw new Error('Word must be a string');
  }

  if (word.length === 0 || word.length > 100) {
    throw new Error('Word must be between 1 and 100 characters');
  }

  // Words should only contain letters, numbers, and basic punctuation
  // Allow emoji patterns (name + ID for custom Discord emojis)
  if (!/^[\w'-]+$|^\d{17,20}$|^[a-z_]{2,}\d{17,20}$/i.test(word)) {
    throw new Error('Word contains invalid characters');
  }

  return word;
}

/**
 * Validate Spotify track ID
 * @param {string} trackId - The Spotify track ID
 * @returns {string} - The validated track ID
 */
export function validateSpotifyTrackId(trackId) {
  if (!trackId) return null;

  if (typeof trackId !== 'string') {
    throw new Error('Spotify track ID must be a string');
  }

  // Spotify track IDs are 22 character base62 strings
  if (!/^[a-zA-Z0-9]{22}$/.test(trackId)) {
    throw new Error('Invalid Spotify track ID format');
  }

  return trackId;
}

/**
 * Validate duration in milliseconds
 * @param {number} durationMs - Duration in milliseconds
 * @returns {number|null} - The validated duration or null
 */
export function validateDuration(durationMs) {
  if (durationMs === null || durationMs === undefined) return null;

  const duration = parseInt(durationMs);
  if (isNaN(duration)) return null;

  // Duration should be between 1 second and 24 hours
  if (duration < 1000 || duration > 24 * 60 * 60 * 1000) {
    return null;
  }

  return duration;
}

/**
 * Validate limit parameter for queries
 * @param {number} limit - The limit value
 * @param {number} defaultLimit - Default limit if invalid
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {number} - The validated limit
 */
export function validateLimit(limit, defaultLimit = 10, maxLimit = 100) {
  const parsed = parseInt(limit);
  if (isNaN(parsed) || parsed < 1) return defaultLimit;
  return Math.min(parsed, maxLimit);
}
