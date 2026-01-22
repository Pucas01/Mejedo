# Discord Bot Features System

Per-server feature toggles for word tracking and Spotify tracking.

## Overview

When the bot joins a server, **all features are disabled by default**. Server admins must explicitly enable the features they want to use with the `/features` command.

## Available Features

### 📝 Word Tracking
Tracks word usage across all messages in the server.
- Builds statistics on most used words
- Weekly recap of top words and most active users
- Filter common words or view all
- View server-wide or personal stats

### 🎵 Spotify Tracking
Tracks what users are listening to on Spotify via Discord presence.
- Logs songs as users listen to them
- Requires users to be added to tracking list
- Weekly recap of top tracks and artists
- View server-wide or personal listening stats

## Commands

### `/features status`
View current feature settings for the server.

Shows:
- Word Tracking: Enabled/Disabled
- Spotify Tracking: Enabled/Disabled

**Example:**
```
/features status
```

### `/features toggle`
Enable or disable a feature for the server (Admin only).

**Options:**
- `feature` - Feature to toggle
  - `Word Tracking`
  - `Spotify Tracking`
- `enabled` - True to enable, False to disable

**Examples:**
```
# Enable word tracking
/features toggle feature:Word Tracking enabled:True

# Disable Spotify tracking
/features toggle feature:Spotify Tracking enabled:False
```

## Default Behavior

### When Bot Joins a Server
1. Guild settings are initialized
2. Both features are **disabled by default**
3. No data is tracked until features are enabled
4. Admin must use `/features toggle` to enable desired features

### Feature Disabled
When a feature is disabled:
- **No new data is tracked**
- Existing data is **preserved** (not deleted)
- Commands still work to view existing stats
- Weekly recaps are not posted

### Feature Enabled
When a feature is enabled:
- Bot starts tracking new data immediately
- All relevant commands become functional
- Weekly recaps resume (if recap channel configured)

## Setup Workflow

### For Word Tracking
1. Enable the feature:
   ```
   /features toggle feature:Word Tracking enabled:True
   ```
2. Users start chatting - words are automatically tracked
3. View stats with `/wordstats`
4. Configure recap channel with `/setrecap` (optional)

### For Spotify Tracking
1. Enable the feature:
   ```
   /features toggle feature:Spotify Tracking enabled:True
   ```
2. Add users to tracking:
   ```
   /trackmusic add @user1
   /trackmusic add @user2
   ```
3. Users listen to music (with Spotify connected to Discord)
4. View stats with `/spotifystats`
5. Configure recap channel with `/setrecap` (optional)

## Database

Feature flags are stored in the `guild_settings` table:
- `word_tracking_enabled` - 0 (disabled) or 1 (enabled)
- `spotify_tracking_enabled` - 0 (disabled) or 1 (enabled)

**Location:** `config/word-stats.db`

## Privacy

### Default Privacy
- New servers have tracking **disabled by default**
- Users must opt-in (indirectly, by server admin enabling)
- This respects user privacy on servers where tracking isn't wanted

### Enabling Features
- Only server admins can enable/disable features
- Users are not individually notified when tracking is enabled
- Word tracking: All messages are tracked (public channel data)
- Spotify tracking: Only tracks users explicitly added to list

### Disabling Features
- Admins can disable at any time
- Existing data is preserved but not deleted
- New data stops being collected immediately

## Permissions

Only users with **Administrator** permission can:
- View feature status (`/features status`)
- Toggle features (`/features toggle`)

Regular users can:
- Use stats commands (if data exists)
- View their own stats
- View server-wide stats

## Migration from Old Servers

For servers that were using the bot before the feature system:

### Automatic Migration
When the bot starts or joins a server, it automatically checks for existing stats data:
- **If word stats exist** → Word tracking is **auto-enabled**
- **If Spotify stats exist** → Spotify tracking is **auto-enabled**
- **If no data exists** → Features remain **disabled** (new server behavior)

This ensures existing servers don't lose tracking when the feature system is introduced.

### Manual Control
After auto-migration:
1. Check feature status: `/features status`
2. Disable features if desired: `/features toggle feature:Word Tracking enabled:False`
3. All existing data is preserved whether enabled or disabled

### Console Logging
The bot logs auto-migration events:
```
[Migration] Auto-enabled features for guild 123456789: Word=Yes, Spotify=No
```

## Best Practices

### New Server Setup
1. Add bot to server
2. Review available features with `/features status`
3. Enable only the features you want
4. Configure tracking (for Spotify) or start using (for words)

### Privacy Considerations
- Inform server members which features are enabled
- Consider creating an announcement or rules channel
- Mention in server description or welcome message
- Respect if users don't want tracking

### Performance
- Features can be disabled temporarily to reduce bot load
- Existing data remains available for viewing
- No data is lost when toggling features

## Troubleshooting

**"Why isn't my data being tracked?"**
- Check if the feature is enabled: `/features status`
- Enable if needed: `/features toggle`

**"I enabled the feature but still no data"**
- Word tracking: Just start chatting
- Spotify tracking: Make sure users are added with `/trackmusic add`

**"Can I delete old data?"**
- Yes, use the admin panel or API endpoints
- Or use `/features toggle` to disable and clear later

**"What happens if I disable and re-enable?"**
- Existing data is preserved
- Tracking resumes immediately when re-enabled
- No data is lost during the disabled period

## Files

```
backend/routes/discord-bot/
├── wordStatsDb.js         # Feature flags & guild settings
├── wordTracker.js         # Checks word_tracking_enabled
├── spotifyTracker.js      # Checks spotify_tracking_enabled
├── bot.js                 # Initializes settings on guild join
└── commands/
    └── features.js        # Feature management command
```

## API

Feature settings are accessible via existing API endpoints:
- Guild settings include feature flags
- Can be viewed in admin panel
- Managed primarily through Discord commands
