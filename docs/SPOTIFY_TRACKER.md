# Discord Spotify Tracker

Tracks what everyone in your Discord server is listening to on Spotify via Discord rich presence.

## Features

- 🎵 Automatic tracking via Discord presence (no Spotify API setup needed!)
- 📊 Personal and server-wide statistics
- 🔥 Weekly recap with top songs/artists
- 🎤 All-time stats with top tracks and artists
- 🔒 **Opt-out by default** - everyone is tracked unless they choose to opt out
- 💻 Web-based admin panel for managing stats
- 🔐 User privacy controls via `/track` commands

## How It Works

When someone connects Spotify to Discord, their currently playing song shows up in their Discord presence. The bot monitors these presence changes and logs every song they listen to.

**Requirements:**
- Users must have Spotify connected to Discord
- Spotify tracking must be enabled for the server (via `/features toggle`)
- Users are tracked by default (opt-out system)

## Commands

### User Commands

**`/spotifystats [scope] [user] [type]`**
View Spotify listening statistics with flexible options.

**Options:**
- `scope` - View server or personal stats (default: server)
  - `Server` - Server-wide stats
  - `Personal` - Your own stats
- `user` - View stats for a specific user (optional)
- `type` - What to display (default: both)
  - `Tracks & Artists` - Show both (default)
  - `Tracks Only` - Just tracks
  - `Artists Only` - Just artists

**Examples:**
- `/spotifystats` - Server-wide tracks and artists
- `/spotifystats scope:Personal` - Your own stats
- `/spotifystats user:@Alice` - Alice's stats
- `/spotifystats scope:Server type:Tracks Only` - Server top tracks only

**`/track optout type:Music`**
Opt yourself out of Spotify tracking across all servers with the bot.

**`/track optin type:Music`**
Opt yourself back into Spotify tracking (removes opt-out).

**`/track status`**
Check if you're currently opted in or out of tracking.

### Admin Commands

**`/forcerecap [type]`**
Force post a weekly recap.

Options:
- `words` - Word stats only
- `music` - Music stats only
- `both` - Both recaps (default)

## Weekly Recap

Automatically posts every Sunday at 12:00 PM (same time as word stats) to the configured recap channel.

Shows:
- 🔥 Top 10 tracks of the week
- 🎤 Top 5 artists of the week
- 👑 Top 5 most active listeners
- 📊 Total plays for the week

Weekly stats reset after each recap.

## Database

**Location:** `config/spotify-stats.db` (SQLite)

**Tables:**
- `spotify_listens` - All-time listening history
- `spotify_listens_weekly` - Weekly stats (reset on recap)
- `global_optout` - Users who have opted out of tracking
- `tracked_users` - Legacy table (no longer used in opt-out system)
- `global_optin` - Legacy table (kept for migration)

## Admin Panel

Access the Spotify Stats Manager from the admin panel:

1. Go to `/admin` and login
2. Scroll to **Discord Bot Settings**
3. Click **Open Spotify Stats Manager**

**Features:**
- View all tracked users
- See top tracks and artists (all-time)
- Export database backup
- Clear all stats

## API Endpoints

Base path: `/api/spotify-stats`

**Public endpoints:**
- `GET /tracked-users` - Get all tracked users
- `GET /guild/:guildId/top-tracks?limit=10` - Server top tracks
- `GET /guild/:guildId/top-artists?limit=10` - Server top artists
- `GET /guild/:guildId/user/:userId/top-tracks?limit=10` - User's top tracks
- `GET /guild/:guildId/user/:userId/top-artists?limit=10` - User's top artists
- `GET /guild/:guildId/user/:userId/stats` - User's stats summary

**Admin endpoints:**
- `GET /export` - Export all stats as JSON
- `DELETE /guild/:guildId` - Clear all stats for a guild
- `GET /db-info` - Get database file path

## Files

```
backend/routes/discord-bot/
├── spotifyStatsDb.js       # Database functions (opt-out system)
├── spotifyTracker.js       # Presence tracking & recap (tracks everyone by default)
├── spotifyStatsApi.js      # API routes
└── commands/
    ├── spotifystats.js     # Stats command (personal/server)
    ├── trackmusic.js       # User opt-out/opt-in management
    └── forcerecap.js       # Updated to include music

app/components/admin/
├── SpotifyStatsModal.jsx   # Admin panel UI
└── DiscordBotSettings.jsx  # Updated with Spotify section
```

## Setup

1. **Enable Discord bot** (if not already running)
   - Configure in admin panel: `/admin` → Discord Bot Config

2. **Enable Spotify tracking feature**
   ```
   /features toggle feature:Spotify Tracking enabled:True
   ```
   ⚠️ **Important:** Spotify tracking is **disabled by default** when the bot joins a server.

3. **Make sure users have Spotify connected to Discord**
   - Discord Settings → Connections → Spotify

4. **That's it!** Everyone is automatically tracked unless they opt out.
   - Users can opt out with `/track optout type:Music`
   - Users can opt back in with `/track optin type:Music`

5. **Test it!**
   - Have someone play a song on Spotify
   - Wait a few seconds for presence to update
   - Check with `/spotifystats`

6. **Configure recap channel** (optional)
   - Use existing word stats recap channel
   - Or set a new one with `/setrecap` command

## How Tracking Works

1. Bot monitors Discord presence updates
2. When a user starts playing a song on Spotify, Discord shows it in their presence
3. Bot checks if Spotify tracking is enabled for the server
4. Bot checks if user has opted out globally
5. If user hasn't opted out, extracts song info (track name, artist, album, Spotify ID)
6. Logs to database (both all-time and weekly tables)
7. Prevents duplicate logs for same song (waits 10 seconds of continuous play)

## Privacy

- **Opt-out by default:** Everyone is tracked unless they choose to opt out
- Only tracks data already publicly visible in Discord (presence)
- Users can opt out anytime with `/track optout type:Music`
- Users can check their status with `/track status`
- Users can opt back in with `/track optin type:Music`
- Opt-out is global across all servers
- Existing listening history is preserved even when opted out

## Example Usage

```bash
# Enable Spotify tracking (admin)
/features toggle feature:Spotify Tracking enabled:True

# Users check their stats
/spotifystats scope:Personal
/spotifystats user:@Alice

# View server trends
/spotifystats
/spotifystats type:Tracks Only
/spotifystats type:Artists Only

# User opts out of tracking
/track optout type:Music

# User checks their tracking status
/track status

# User opts back in
/track optin type:Music

# Admin forces a preview recap
/forcerecap music
```

## Tips

- Songs only log when Spotify is open and playing
- Discord must be running for presence to work
- Private/incognito sessions won't show in Discord
- Podcasts are tracked as regular "songs"
- Local files may show with limited metadata

## Future Enhancements

Ideas for expanding the system:
- Genre classification
- Listening time heatmaps (by hour/day)
- Playlist recommendations based on compatibility
- Most diverse listener award
- Streak tracking (consecutive days listening)
- Artist discovery stats (new vs repeated)
- Website integration for public leaderboards
