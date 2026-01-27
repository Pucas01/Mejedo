# Discord Game Tracker

Tracks gaming activity via Discord presence, measuring hours played instead of play counts.

## Features

- Automatic tracking via Discord presence (no external API needed)
- Personal and server-wide statistics
- Gaming streaks (consecutive days playing the same game)
- Longest streak ever tracking
- Optional DM notifications for streak updates (2+ day streaks)
- Weekly recap with top games and gamers
- All-time stats tracking
- Opt-in by default (everyone tracked unless they opt out)
- Web-based admin panel for managing stats
- GDPR-compliant data deletion

## How It Works

When someone plays a game, Discord shows it in their presence. The bot monitors presence changes and tracks:
- When a game session starts
- When it ends
- Total duration in seconds
- Converts to hours for display

**Requirements:**
- Game must be visible in Discord presence
- Game tracking must be enabled for the server
- Users are tracked by default (opt-out system)

## Commands

### User Commands

**`/gamestats [scope] [user] [type]`**
View gaming statistics.

**Options:**
- `scope` - View server or personal stats (default: server)
  - `Server` - Server-wide stats
  - `Personal` - Your own stats
- `user` - View stats for a specific user (optional)
- `type` - What to display (default: both)
  - `Games & Gamers` - Show both (default)
  - `Games Only` - Just games
  - `Gamers Only` - Just gamers

**Examples:**
- `/gamestats` - Server-wide games and gamers
- `/gamestats scope:Personal` - Your own stats
- `/gamestats user:@Alice` - Alice's stats
- `/gamestats scope:Server type:Games Only` - Server top games only

**`/track optout type:Gaming`**
Opt yourself out of game tracking across all servers with the bot.

**`/track optin type:Gaming`**
Opt yourself back into game tracking (removes opt-out).

**`/track optout type:Streak DMs`**
Disable streak DM notifications (you'll still be tracked, but won't get DM alerts for streaks).

**`/track optin type:Streak DMs`**
Enable streak DM notifications (get DMs when your gaming streaks update, 2+ day streaks only).

**`/track status`**
Check if you're currently opted in or out of tracking (shows music, gaming, and streak DM status).

**`/hopon user:@someone game:GameName [image/imageurl]`**
Request someone to hop on a game with you. Game name autocompletes from their top played games. Optionally attach a custom image or provide an image URL.

**`/bottime`**
Show the current bot time (UTC) and when streaks reset (midnight UTC).

### Admin Commands

**`/features toggle feature:Game Tracking enabled:True/False`**
Enable or disable game tracking for the server.

**`/forcerecap [type]`**
Force post a weekly recap.

Options:
- `words` - Word stats only
- `music` - Music stats only
- `gaming` - Gaming stats only
- `all` - All recaps (default)

## Weekly Recap

Automatically posts every Sunday at 12:00 PM (same time as word/music stats) to the configured recap channel.

Shows:
- Top 5 games of the week (by hours played)
- Top 5 gamers of the week (by hours played)
- Total gaming hours for the week
- Average hours per active gamer

Weekly stats reset after each recap.

**Note:** Set the recap channel and schedule with `/setrecap` command (defaults to Sunday at 12:00 PM).

## Database

**Location:** `config/game-stats.db` (SQLite)

**Tables:**
- `game_sessions` - All-time session history
- `game_sessions_weekly` - Weekly stats (reset on recap)
- `game_streaks` - Current streaks for each user/game combination
- `game_streaks_history` - Historical record of all streaks
- `global_optout_gaming` - Users who have opted out
- `streak_dm_optout` - Users who opted out of streak DM notifications

**Session Structure:**
```sql
{
  id: INTEGER,
  guild_id: TEXT,
  user_id: TEXT,
  game_name: TEXT,
  game_id: TEXT,              -- Discord application ID
  start_time: INTEGER,        -- Unix timestamp
  end_time: INTEGER,          -- Unix timestamp
  duration_seconds: INTEGER,  -- Calculated: end - start
  created_at: INTEGER
}
```

## Admin Panel

Access the Game Stats Manager from the admin panel:

1. Go to `/admin` and login
2. Scroll to **Discord Bot Settings**
3. Click **Open Game Stats Manager**

**Features:**
- View all active gamers
- See top games (all-time)
- View top gamers (all-time)
- Export database backup
- Clear all stats

## API Endpoints

Base path: `/api/game-stats`

**All endpoints require authentication**

**Stats endpoints:**
- `GET /guild/:guildId/top-games?limit=10&weekly=false` - Top games
- `GET /guild/:guildId/top-gamers?limit=10&weekly=false` - Top gamers
- `GET /guild/:guildId/user/:userId/top-games?limit=10` - User's top games
- `GET /guild/:guildId/user/:userId/stats` - User's stats summary
- `GET /guild/:guildId/stats` - Guild stats summary

**Admin endpoints:**
- `GET /export` - Export all stats as JSON
- `DELETE /guild/:guildId` - Clear all stats for a guild
- `GET /db-info` - Get database file path

## Files

```
backend/routes/discord-bot/
├── gameStatsDb.js          # Database functions
├── gameTracker.js          # Presence tracking, streaks & recap
├── gameStatsApi.js         # API routes
└── commands/
    ├── gamestats.js        # Stats command
    ├── track.js            # Opt-out/opt-in management (music, gaming, streakdms)
    ├── hopon.js            # Request to hop on game
    ├── bottime.js          # Show bot time & streak reset
    └── teststreakdm.js     # Test streak DM notifications

config/
└── game-stats.db           # SQLite database
```

## Setup

1. **Enable Discord bot** (if not already running)
   - Configure in admin panel: `/admin` → Discord Bot Config

2. **Enable game tracking feature**
   ```
   /features toggle feature:Game Tracking enabled:True
   ```
   Important: Game tracking is **disabled by default** when the bot joins a server.

3. **That's it!** Everyone is automatically tracked unless they opt out.
   - Users can opt out with `/track optout type:Gaming`
   - Users can opt back in with `/track optin type:Gaming`
   - Users can disable streak DM notifications with `/track optout type:Streak DMs`

4. **Test it!**
   - Have someone play a game
   - Wait a few seconds for presence to update
   - Check with `/gamestats`

5. **Configure recap channel** (optional)
   - Use existing word/music recap channel
   - Or set a new one with `/setrecap` command

## How Tracking Works

1. Bot monitors Discord presence updates
2. When a user starts playing a game, Discord shows it in their presence
3. Bot checks if game tracking is enabled for the server
4. Bot checks if user has opted out globally
5. If user hasn't opted out, records session start time
6. When user stops playing, records end time and calculates duration
7. Logs to database (both all-time and weekly tables)
8. Sessions are checkpointed every 5 minutes to prevent data loss

## Edge Cases Handled

- **Bot restart while user playing** → Ends all active sessions on startup
- **User goes offline** → Active session ends automatically
- **Long sessions** → Checkpointed every 5 minutes to prevent data loss on crash
- **Same game, different sessions** → Tracked as separate sessions, aggregated in queries
- **Game switching** → Old session ends, new session starts

## Privacy

- **Opt-in by default:** Everyone is tracked unless they choose to opt out
- Only tracks data already publicly visible in Discord (presence)
- Users can opt out anytime with `/track optout type:Gaming`
- Users can check their status with `/track status`
- Users can opt back in with `/track optin type:Gaming`
- Users can disable streak DM notifications with `/track optout type:Streak DMs`
- Opt-out is global across all servers with the bot
- Existing gaming history is preserved even when opted out
- `/deletedata` command permanently removes all gaming data (GDPR compliance)

## Example Usage

```bash
# Enable game tracking (admin)
/features toggle feature:Game Tracking enabled:True

# Check feature status
/features status

# Users check their stats
/gamestats scope:Personal
/gamestats user:@Alice

# View server trends
/gamestats
/gamestats type:Games Only
/gamestats type:Gamers Only

# User opts out of tracking
/track optout type:Gaming

# User checks their tracking status
/track status

# User opts back in
/track optin type:Gaming

# Admin forces a preview recap
/forcerecap gaming
/forcerecap all
```

## Stats Display

**Personal stats:**
```
Your Gaming Stats (All-Time)

Current Streaks:
🔥 5-day streak: Minecraft
🔥 3-day streak: Valorant

Longest Streak Ever:
12-day streak: League of Legends

Summary:
Total Gaming: 89.4 hours
Unique Games: 12
Total Sessions: 47
Avg Session: 114 minutes

Top Games:
1. Minecraft - 24.3h (15 sessions)
2. Valorant - 18.7h (12 sessions)
3. League of Legends - 15.2h (8 sessions)
...
```

**Server stats:**
```
Server Gaming Stats (All-Time)

Top Games:
1. Minecraft - 47.3h (8 players)
2. League of Legends - 32.8h (5 players)
3. Valorant - 28.5h (6 players)
...

Top Gamers:
1. Alice - 89.4h (12 games)
2. Bob - 67.2h (9 games)
3. Charlie - 54.1h (11 games)
...

Summary:
Total Gaming: 347.8 hours
Active Gamers: 15
Unique Games: 23
Avg per Gamer: 23.2 hours
```

## Tips

- Games only track when Discord is running
- Discord must be running for presence to work
- Some games may not show in Discord presence
- Game name comes from Discord, may vary by region/language
- Local/non-Steam games may show with limited info
- Session checkpoints every 5 minutes prevent data loss

## Differences from Spotify Tracking

**Spotify Tracking:**
- Tracks discrete "plays" (songs)
- Each song = 1 play count
- Tracks: song name, artist, album, Spotify ID

**Game Tracking:**
- Tracks continuous "sessions" (time ranges)
- Duration calculated: end_time - start_time
- Aggregates into hours played
- Tracks: game name, Discord application ID

## Integration

Game tracking integrates seamlessly with existing bot features:

- **Shared recap channel** with word/music stats
- **Same opt-out system** as Spotify tracking
- **Same feature toggle system** via `/features`
- **Same admin panel** structure
- **Same GDPR compliance** via `/deletedata`
- **Weekly recaps** scheduled at same time (Sunday 12 PM)
