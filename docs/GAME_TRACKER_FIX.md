# Game Tracker Duplication Fix

## Problem

When a user is in multiple Discord servers with the bot, their gaming sessions were being logged **once per guild**. This caused their **global stats** (stats across all guilds) to count duplicate playtime.

### Example of the Bug

User plays Minecraft for 1 hour while in 2 servers with the bot:
- Server A logs: 1 hour session
- Server B logs: 1 hour session (duplicate)
- **Global stats showed: 2 hours** ❌ (should be 1 hour)
- Per-server stats were correct ✅

## Root Cause

The `presenceUpdate` event fires **once per guild** the user is in. The handler in [gameTracker.js:15-53](../backend/routes/discord-bot/gameTracker.js#L15-L53) runs for each guild, creating separate database entries with different `guild_id` values but identical session data.

When calculating global stats, the queries summed ALL sessions without deduplication, counting the same gaming session multiple times.

## Solution

Modified the global stats queries to **deduplicate sessions** using `SELECT DISTINCT` on the unique identifier `(user_id, game_name, start_time)`.

### Files Changed

1. **[gameStatsDb.js](../backend/routes/discord-bot/gameStatsDb.js)**
   - `getGlobalUserStats()` - Line 438-451
   - `getGlobalTopGamesForUser()` - Line 459-479

2. **[gameStatsApi.js](../backend/routes/discord-bot/gameStatsApi.js)**
   - Added missing `GET /user/:userId` endpoint - Line 81-102

### Before (Incorrect)

```sql
SELECT
  SUM(duration_seconds) as total_seconds
FROM game_sessions
WHERE user_id = ?
  AND end_time IS NOT NULL
```

This counts duplicate sessions across guilds.

### After (Fixed)

```sql
SELECT
  SUM(duration_seconds) as total_seconds
FROM (
  SELECT DISTINCT user_id, game_name, start_time, duration_seconds
  FROM game_sessions
  WHERE user_id = ?
    AND end_time IS NOT NULL
)
```

This deduplicates by `(user_id, game_name, start_time)` before aggregating.

## What Still Works Correctly

- ✅ **Per-guild stats** - Still accurate, unchanged
- ✅ **Streaks** - Already used `SELECT DISTINCT DATE(...)` for dates
- ✅ **Weekly recaps** - Per-guild, so no duplication issue
- ✅ **Session logging** - Still logs to all guilds (needed for per-guild stats)

## What's Now Fixed

- ✅ **Global stats in `/gamestats scope:Personal`** - Shows correct total hours
- ✅ **Global top games** - Aggregates playtime correctly
- ✅ **API endpoint `GET /user/:userId`** - Returns deduplicated global stats
- ✅ **Summary stats** - Total sessions, unique games, avg session length

## Testing

To verify the fix works:

1. **Setup**: Have the bot in 2+ servers with game tracking enabled
2. **Action**: Play a game for a measurable time (e.g., 30+ minutes)
3. **Check**: Run `/gamestats scope:Personal`
4. **Expected**: Total hours should match actual playtime, not multiplied by number of servers

## Migration

**No migration needed!**
- Existing data remains unchanged
- Per-guild stats stay accurate
- Global stats queries now automatically deduplicate

Users with inflated stats from the bug will see corrected numbers immediately.

## Future Considerations

This is a **query-level fix** (Option 2). A more elegant solution would be:

### Option 1: Single Global Session + Guild Junction Table
- Create one session globally per user
- Link to guilds via junction table
- Would require database migration
- More efficient queries, but breaking change

For now, Option 2 is sufficient and non-breaking.

## Related Files

- [gameStatsDb.js](../backend/routes/discord-bot/gameStatsDb.js) - Database functions
- [gameTracker.js](../backend/routes/discord-bot/gameTracker.js) - Presence tracking
- [gamestats.js](../backend/routes/discord-bot/commands/gamestats.js) - Stats command
- [gameStatsApi.js](../backend/routes/discord-bot/gameStatsApi.js) - API endpoints
- [GAME_TRACKER.md](GAME_TRACKER.md) - System documentation
