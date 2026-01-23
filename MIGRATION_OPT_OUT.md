# Spotify Tracking Migration: Opt-In → Opt-Out

## Summary of Changes

The Spotify tracking system has been changed from **opt-in** (users must be added) to **opt-out** (everyone is tracked by default).

## What Changed

### Before (Opt-In)
- Admins had to manually add users with `/trackmusic add @user`
- Only users in the `tracked_users` table were tracked
- Users could opt themselves in globally with `/trackmusic optin`

### After (Opt-Out)
- **Everyone is tracked automatically** when Spotify tracking is enabled
- Users can opt themselves OUT with `/trackmusic optout`
- No admin action required to start tracking
- Tracking check: "Is user opted out?" instead of "Is user tracked?"

## Database Changes

### New Table
- `global_optout` - Users who don't want to be tracked (new)

### Legacy Tables (Preserved)
- `global_optin` - Kept for migration, no longer used
- `tracked_users` - No longer used, but kept for historical data

### New Functions
```javascript
// New opt-out functions
setGlobalOptOut(userId, username)
isGloballyOptedOut(userId)
removeGlobalOptOut(userId)

// New logging function
logListen(guildId, userId, trackName, artist, album, spotifyTrackId, durationMs)
```

## Migration Safety

### Automatic Migration
On bot startup, the migration function runs:
```javascript
migrateOptInToOptOut()
```

This migration:
- ✅ Preserves all existing listening data
- ✅ Users who opted in before are still tracked (not added to opt-out list)
- ✅ Does NOT delete the legacy `global_optin` table
- ✅ Safe to run multiple times (idempotent)

### What Happens to Existing Users

**Users who were explicitly opted in:**
- Continue to be tracked (they're not in the opt-out list)
- No action needed

**Users who were NOT tracked before:**
- Will NOW be tracked by default
- Can opt out with `/trackmusic optout`

## Command Changes

### Removed Commands
- `/trackmusic add @user` - No longer needed (everyone tracked by default)
- `/trackmusic remove @user` - No longer needed (users opt themselves out)
- `/trackmusic list` - No longer needed (no tracking list to manage)

### New Commands
- `/trackmusic optout` - User opts out of tracking
- `/trackmusic optin` - User opts back in
- `/trackmusic status` - Check tracking status

## Code Changes

### Files Modified
1. **spotifyStatsDb.js**
   - Added `global_optout` table
   - Added opt-out functions
   - Added migration function
   - Added `logListen()` for single-guild logging

2. **spotifyTracker.js**
   - Changed from `isUserTrackedGlobally()` to `isGloballyOptedOut()`
   - Changed from `logListenToAllGuilds()` to `logListen(guildId, ...)`
   - Tracks everyone by default (unless opted out)

3. **trackmusic.js**
   - Complete rewrite for opt-out system
   - Removed admin-only subcommands
   - Added user-facing opt-out/in/status commands

4. **bot.js**
   - Removed `tracked_users` cleanup logic
   - Added migration call on startup
   - Removed auto-tracking on guild join

## Testing Checklist

Before deploying to production:

- [ ] Backup `config/spotify-stats.db`
- [ ] Test migration on dev environment
- [ ] Verify existing users still have their stats
- [ ] Test `/trackmusic optout` command
- [ ] Test `/trackmusic optin` command
- [ ] Test `/trackmusic status` command
- [ ] Verify tracking works for new users
- [ ] Verify opted-out users are NOT tracked
- [ ] Test weekly recap still works
- [ ] Test `/spotifystats` command

## Deployment Steps

1. **Backup database:**
   ```bash
   cp config/spotify-stats.db config/spotify-stats.db.backup
   ```

2. **Deploy updated code:**
   ```bash
   git pull
   npm install
   ```

3. **Restart bot:**
   ```bash
   pm2 restart discord-bot
   # or
   npm run server
   ```

4. **Verify migration:**
   Check logs for:
   ```
   [Migration] Found X users with explicit opt-in...
   Spotify tracking migration completed (opt-in → opt-out)
   ```

5. **Test commands:**
   ```
   /trackmusic status
   /spotifystats
   ```

## Rollback Plan

If something goes wrong:

1. **Restore database backup:**
   ```bash
   cp config/spotify-stats.db.backup config/spotify-stats.db
   ```

2. **Revert code:**
   ```bash
   git revert <commit-hash>
   ```

3. **Restart bot:**
   ```bash
   pm2 restart discord-bot
   ```

## Privacy Considerations

### User Communication
Consider announcing the change to your users:

```
📢 **Spotify Tracking Update**

We've updated how Spotify tracking works:

**What's new:**
• Everyone is now tracked by default (if you have Spotify connected)
• You can opt out anytime with `/trackmusic optout`
• Check your status with `/trackmusic status`
• Opt back in with `/trackmusic optin`

**Why this change:**
• Easier for everyone - no admin setup needed
• You stay in control with opt-out commands
• All existing data is preserved

Questions? Use `/trackmusic status` to check your tracking status!
```

### GDPR/Privacy Compliance
- ✅ Users can opt out at any time
- ✅ Users can check their status
- ✅ Users can opt back in
- ✅ Only tracks publicly visible Discord presence data
- ⚠️ Consider adding deletion option (admins can manually delete from database)

## Performance Impact

### Before
- Checked `tracked_users` table for each presence update
- Limited to users in tracking list

### After
- Checks `global_optout` table for each presence update
- Tracks all guild members (unless opted out)
- **More database writes** (more users tracked)
- **Smaller opt-out table** than tracking list (most users won't opt out)

### Expected Impact
- Slightly higher database usage
- More complete statistics
- Simpler code (no per-guild tracking management)

## Future Enhancements

Potential future additions:
- `/trackmusic delete` - Delete all personal data (GDPR right to erasure)
- Per-guild opt-out (in addition to global)
- Admin dashboard to see opt-out statistics
- Announcement when tracking is enabled in a server
