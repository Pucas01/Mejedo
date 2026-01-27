export function isValidSnowflake(id) {
  if (typeof id !== 'string') return false;
  return /^\d{17,20}$/.test(id);
}

export function validateSnowflake(id, fieldName = 'ID') {
  if (!isValidSnowflake(id)) {
    throw new Error(`Invalid ${fieldName}: must be a valid Discord ID (17-20 digits)`);
  }
  return id;
}

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

  const sanitized = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  return sanitized;
}

export function validateUsername(username) {
  return validateText(username, 32, 'Username');
}

export function validateTrackName(trackName) {
  return validateText(trackName, 200, 'Track name');
}

export function validateArtistName(artistName) {
  return validateText(artistName, 200, 'Artist name');
}

export function validateAlbumName(albumName) {
  if (!albumName) return null;
  return validateText(albumName, 200, 'Album name');
}

export function validateWord(word) {
  if (typeof word !== 'string') {
    throw new Error('Word must be a string');
  }

  if (word.length === 0 || word.length > 100) {
    throw new Error('Word must be between 1 and 100 characters');
  }

  if (!/^[\w'-]+$|^\d{17,20}$|^[a-z_]{2,}\d{17,20}$/i.test(word)) {
    throw new Error('Word contains invalid characters');
  }

  return word;
}

export function validateSpotifyTrackId(trackId) {
  if (!trackId) return null;

  if (typeof trackId !== 'string') {
    throw new Error('Spotify track ID must be a string');
  }

  if (!/^[a-zA-Z0-9]{22}$/.test(trackId)) {
    throw new Error('Invalid Spotify track ID format');
  }

  return trackId;
}

export function validateDuration(durationMs) {
  if (durationMs === null || durationMs === undefined) return null;

  const duration = parseInt(durationMs);
  if (isNaN(duration)) return null;

  if (duration < 1000 || duration > 24 * 60 * 60 * 1000) {
    return null;
  }

  return duration;
}

export function validateLimit(limit, defaultLimit = 10, maxLimit = 100) {
  const parsed = parseInt(limit);
  if (isNaN(parsed) || parsed < 1) return defaultLimit;
  return Math.min(parsed, maxLimit);
}
