# Discord Game Tracker

Tracks gaming activity via Discord presence, measuring hours played instead of play counts.

## Features

- Automatic tracking via Discord presence (no external API needed)
- Personal and server-wide statistics
- Weekly recap with top games and gamers
- All-time stats tracking
- Opt-out by default (everyone tracked unless they opt out)
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

**`/track status`**
Check if you're currently opted in or out of tracking (shows both music and gaming status).

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

## Database

**Location:** `config/game-stats.db` (SQLite)

**Tables:**
- `game_sessions` - All-time session history
- `game_sessions_weekly` - Weekly stats (reset on recap)
- `global_optout_gaming` - Users who have opted out

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
├── gameTracker.js          # Presence tracking & recap
├── gameStatsApi.js         # API routes
└── commands/
    ├── gamestats.js        # Stats command
    └── trackgaming.js      # Opt-out/opt-in management

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

- **Opt-out by default:** Everyone is tracked unless they choose to opt out
- Only tracks data already publicly visible in Discord (presence)
- Users can opt out anytime with `/track optout type:Gaming`
- Users can check their status with `/track status`
- Users can opt back in with `/track optin type:Gaming`
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
