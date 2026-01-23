# Discord Bot Security Improvements

This document outlines the security and production-readiness improvements made to the Discord bot.

## 1. Input Validation (Issue #3)

### What Was Added

Created a comprehensive validation module ([`validation.js`](../backend/routes/discord-bot/validation.js)) that validates all user input from Discord:

- **Discord Snowflake IDs** - Validates user IDs, guild IDs, channel IDs (17-20 digit strings)
- **Text Input** - Sanitizes and limits track names, artist names, album names, usernames
- **Words** - Validates word entries for word tracking
- **Spotify Track IDs** - Validates Spotify's 22-character base62 format
- **Duration** - Validates song duration (1 second to 24 hours)
- **Limits** - Validates query limit parameters

### Files Modified

- **[backend/routes/discord-bot/validation.js](../backend/routes/discord-bot/validation.js)** - New validation module
- **[backend/routes/discord-bot/wordStatsDb.js](../backend/routes/discord-bot/wordStatsDb.js)** - Added validation to all database functions
- **[backend/routes/discord-bot/spotifyStatsDb.js](../backend/routes/discord-bot/spotifyStatsDb.js)** - Added validation to all database functions

### Security Benefits

- **SQL Injection Prevention** - Although using parameterized queries, validation adds extra layer
- **Data Integrity** - Prevents malformed data from entering database
- **Resource Protection** - Limits string lengths to prevent memory exhaustion
- **Attack Surface Reduction** - Rejects invalid input before processing

### Example Usage

```javascript
import { validateSnowflake, validateTrackName } from './validation.js';

// Validate Discord IDs
validateSnowflake(guildId, 'Guild ID'); // Throws if invalid

// Validate and sanitize text
const sanitizedTrack = validateTrackName(trackName); // Max 200 chars, control chars removed
```

---

## 2. GDPR Data Deletion (Issue #4)

### What Was Added

Implemented comprehensive user data deletion to comply with GDPR "Right to be Forgotten":

#### New Functions

**In `spotifyStatsDb.js`:**
```javascript
deleteAllUserData(userId)
```
Deletes:
- All Spotify listening history (all-time and weekly)
- Tracked user status across all guilds
- Opt-out/opt-in preferences

**In `wordStatsDb.js`:**
```javascript
deleteAllUserWordData(userId)
```
Deletes:
- All word statistics (all-time and weekly)

#### New Command

**[/deletedata](../backend/routes/discord-bot/commands/deletedata.js)**

Users can run `/deletedata` to permanently delete all their data:

1. Shows detailed confirmation screen explaining what will be deleted
2. Requires user to type `CONFIRM DELETE` (60-second timeout)
3. Deletes all data across all servers
4. Provides success confirmation

### Files Modified

- **[backend/routes/discord-bot/spotifyStatsDb.js](../backend/routes/discord-bot/spotifyStatsDb.js)** - Added `deleteAllUserData()`
- **[backend/routes/discord-bot/wordStatsDb.js](../backend/routes/discord-bot/wordStatsDb.js)** - Added `deleteAllUserWordData()`
- **[backend/routes/discord-bot/commands/deletedata.js](../backend/routes/discord-bot/commands/deletedata.js)** - New command

### GDPR Compliance

- ✅ **Right to be Forgotten** - Users can delete all their data
- ✅ **Irreversible** - Data is permanently deleted from database
- ✅ **Comprehensive** - Deletes ALL user data across all tables
- ✅ **User-Initiated** - Users have full control via `/deletedata` command
- ✅ **Confirmation Required** - Prevents accidental deletion

### Usage

```bash
# User types in Discord:
/deletedata

# Bot shows confirmation screen
# User types: CONFIRM DELETE
# All data is permanently deleted
```

---

## 3. Graceful Shutdown (Issue #6)

### What Was Added

Implemented proper graceful shutdown handling to prevent data loss and ensure clean exits:

#### In `bot.js`

Enhanced `stop()` method to:
1. Stop all scheduled tasks (word recap, Spotify recap)
2. Flush pending Spotify logs
3. Set bot status to offline
4. Destroy Discord client connection cleanly

#### In `spotifyTracker.js`

Added `flushPendingLogs()` function:
- Clears all timeout timers for pending song logs
- Prevents memory leaks from dangling timeouts
- Ensures clean state on shutdown

#### In `server.js`

Added comprehensive shutdown handlers:
- **SIGTERM** - Graceful shutdown on container stop
- **SIGINT** - Graceful shutdown on Ctrl+C
- **SIGTERM** - Prevents shutdown loops
- **Uncaught Exceptions** - Logs and shuts down gracefully
- **Unhandled Rejections** - Logs but doesn't exit (avoids crashes)

### Files Modified

- **[backend/routes/discord-bot/bot.js](../backend/routes/discord-bot/bot.js)** - Enhanced `stop()` method
- **[backend/routes/discord-bot/spotifyTracker.js](../backend/routes/discord-bot/spotifyTracker.js)** - Added `flushPendingLogs()`
- **[backend/server.js](../backend/server.js)** - Added signal handlers

### Shutdown Flow

```
1. Signal received (SIGTERM/SIGINT)
2. Stop accepting new requests
3. Wait 5 seconds for active requests to complete
4. Stop all scheduled intervals
5. Flush pending Spotify logs (clear timeouts)
6. Set bot status to offline
7. Destroy Discord client
8. Exit process (code 0 = success)
```

### Benefits

- **No Data Loss** - Pending operations complete before shutdown
- **Clean Exit** - Discord client properly disconnected
- **Container-Friendly** - Works with Docker, PM2, systemd
- **Developer-Friendly** - Ctrl+C works as expected
- **Production-Ready** - Handles all common termination signals

### Testing

```bash
# Test graceful shutdown
npm run server

# Press Ctrl+C
# Should see:
# SIGINT received. Starting graceful shutdown...
# Stopping Discord bot...
# Stopped scheduled tasks
# Flushed pending Spotify logs
# Bot status set to offline
# Discord bot stopped gracefully
# Graceful shutdown complete
```

---

---

## 4. API Authentication (Issue #5)

### What Was Added

Added `requireAuth` middleware to all previously-public Spotify stats API endpoints to prevent unauthorized access to user data.

### Protected Endpoints

**All endpoints now require admin authentication:**

- `GET /api/spotify-stats/tracked-users` - List of tracked users
- `GET /api/spotify-stats/guild/:guildId/tracked-users` - Guild's tracked users
- `GET /api/spotify-stats/guild/:guildId/top-tracks` - Server top tracks
- `GET /api/spotify-stats/guild/:guildId/top-artists` - Server top artists
- `GET /api/spotify-stats/guild/:guildId/user/:userId/top-tracks` - User's top tracks
- `GET /api/spotify-stats/guild/:guildId/user/:userId/top-artists` - User's top artists
- `GET /api/spotify-stats/guild/:guildId/user/:userId/stats` - User's stats summary

### Files Modified

- **[backend/routes/discord-bot/spotifyStatsApi.js](../backend/routes/discord-bot/spotifyStatsApi.js)** - Added `requireAuth` to 7 endpoints

### Security Benefits

- **Prevents Data Leaks** - User listening data no longer publicly accessible
- **Access Control** - Only authenticated admins can view stats
- **Privacy Protection** - User IDs and listening habits protected from unauthorized access
- **Compliance** - Aligns with privacy best practices

### Before/After

**Before:**
```bash
# Anyone could access user data
curl http://localhost:4000/api/spotify-stats/tracked-users
# Returns all tracked users
```

**After:**
```bash
# Unauthorized access denied
curl http://localhost:4000/api/spotify-stats/tracked-users
# Returns 401 Unauthorized

# Must be authenticated admin
curl http://localhost:4000/api/spotify-stats/tracked-users \
  --cookie "connect.sid=YOUR_SESSION_ID"
# Returns data only if admin
```

---

## Summary

All four high-priority security issues have been implemented:

| Issue | Status | Impact |
|-------|--------|--------|
| #3 - Input Validation | ✅ Complete | Prevents SQL injection, invalid data, memory exhaustion |
| #4 - GDPR Deletion | ✅ Complete | Complies with right to be forgotten, user privacy control |
| #5 - API Authentication | ✅ Complete | Protects user data from unauthorized access |
| #6 - Graceful Shutdown | ✅ Complete | Prevents data loss, clean exits, production-ready |

## Next Steps

Consider implementing these medium-priority improvements:

1. **Rate Limiting** - Add `express-rate-limit` to API endpoints
2. **SQLite WAL Mode** - Enable WAL for better concurrency
3. **Health Check Endpoint** - Add `/api/discord-bot-config/health`
4. **Structured Logging** - Replace `console.log` with Winston/Pino
5. **Environment Variables** - Move bot token to `.env` file

## Testing Checklist

- [x] Validation rejects invalid Discord IDs
- [x] Validation sanitizes malicious text input
- [x] `/deletedata` command works and deletes all data
- [x] Graceful shutdown completes without errors
- [ ] Run bot under load to verify stability
- [ ] Test with multiple guilds simultaneously
- [ ] Verify no memory leaks after 24h+ uptime
