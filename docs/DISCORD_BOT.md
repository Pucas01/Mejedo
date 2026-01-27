# Discord Bot

## Commands

### Statistics Commands
| Command | Type | Description |
|---------|------|-------------|
| `/wordstats` | Slash | View word usage stats (server/personal, filtered/unfiltered) |
| `/wordstats user:@someone` | Slash | View another user's stats |
| `/gamestats` | Slash | View gaming statistics (server/personal, games/gamers/both) |
| `/spotifystats` | Slash | View Spotify listening stats (server/personal, tracks/artists/both) |

### Tracking & Privacy Commands
| Command | Type | Description |
|---------|------|-------------|
| `/track optout` | Slash | Opt out of tracking (music/gaming/streakdms/both) |
| `/track optin` | Slash | Opt back into tracking (music/gaming/streakdms/both) |
| `/track status` | Slash | Check your current tracking status |
| `/deletedata` | Slash | Permanently delete all your data from the bot (GDPR compliance) |

### Admin Commands
| Command | Type | Description |
|---------|------|-------------|
| `/features status` | Slash | View current feature settings for the server |
| `/features toggle` | Slash | Toggle features (word/spotify/game tracking, announcements) |
| `/setrecap` | Slash | Set the channel and schedule for weekly word stats recaps |
| `/setannouncements` | Slash | Set the announcement channel for this server |
| `/forcerecap` | Slash | Force post weekly recap (admin only) |

### Utility Commands
| Command | Type | Description |
|---------|------|-------------|
| `/hopon` | Slash | Request someone to hop on a game with you (with optional custom image) |
| `/bottime` | Slash | Show the current bot time and when streaks reset |
| `/teststreakdm` | Slash | Test streak DM notifications |

### Fun Commands
| Command | Type | Description |
|---------|------|-------------|
| `/skysill` | Slash | 50/50 spinner animation |
| `/evie` | Slash | Akechi rant |
| `/pucas01` | Slash | Link |
| `/spencer` | Slash | User mention |
| `/cookieclouds` | Slash | Twitch promo |
| `retro` | Context Menu | Right-click message -> Apps -> retro. Replies "Ain't no way" |

## Tracking Systems

### Word Stats System
Tracks word usage across all messages (excluding bots).

**Features:**
- Per-user and server-wide stats
- Common words filtered by default (the, a, is, etc.)
- Weekly recap posted automatically (configurable day/time)
- All-time stats persist, weekly stats reset after recap

**Config:**
Use `/setrecap` command to configure channel, day, and time.

**Database:**
Stored in `config/word-stats.db` (SQLite)

### Game Tracking System
Tracks users' gaming activity from their Discord presence.

**Features:**
- Tracks gaming sessions automatically from Discord presence
- Per-user and server-wide stats
- Gaming streaks (consecutive days playing the same game)
- Longest streak tracking
- Optional DM notifications for streak updates (2+ day streaks)
- Global stats across all servers
- Users can opt out with `/track optout type:Gaming`

**Database:**
Stored in `config/game-stats.db` (SQLite)

### Spotify Tracking System
Tracks users' Spotify listening from their Discord presence.

**Features:**
- Tracks Spotify listening automatically from Discord presence
- Per-user and server-wide stats
- Top tracks and artists
- Global stats across all servers
- Users can opt out with `/track optout type:Music`

**Database:**
Stored in `config/spotify-stats.db` (SQLite)

## Files

```
backend/routes/discord-bot/
├── bot.js                    # Main bot class
├── config.js                 # Config API routes
├── validation.js             # Input validation utilities
├── wordTracker.js            # Message tracking & weekly recap
├── wordStatsDb.js            # Word stats database functions
├── wordStatsApi.js           # Word stats API routes
├── gameTracker.js            # Game presence tracking & streaks
├── gameStatsDb.js            # Game stats database functions
├── gameStatsApi.js           # Game stats API routes
├── spotifyTracker.js         # Spotify presence tracking
├── spotifyStatsDb.js         # Spotify stats database functions
├── spotifyStatsApi.js        # Spotify stats API routes
├── announcementsApi.js       # Announcements API routes
├── temperatureConverter.js   # Temperature conversion utility
└── commands/
    ├── wordstats.js          # Word stats command
    ├── gamestats.js          # Game stats command
    ├── spotifystats.js       # Spotify stats command
    ├── track.js              # Tracking opt-out/in command
    ├── deletedata.js         # GDPR data deletion command
    ├── features.js           # Server feature management (admin)
    ├── setrecap.js           # Set recap channel/schedule (admin)
    ├── setannouncements.js   # Set announcement channel (admin)
    ├── forcerecap.js         # Force weekly recap (admin)
    ├── hopon.js              # Request to hop on game
    ├── bottime.js            # Show bot time & streak reset
    ├── teststreakdm.js       # Test streak DM notifications
    ├── skysill.js            # Fun command
    ├── retro.js              # Context menu command
    ├── evie.js               # Fun command
    ├── pucas01.js            # Fun command
    ├── spencer.js            # Fun command
    └── cookieclouds.js       # Fun command
```

## Config

`config/discord-bot.json`:
```json
{
  "token": "BOT_TOKEN",
  "clientId": "CLIENT_ID",
  "guildId": "",
  "enabled": true
}
```

- `guildId`: Set for instant command updates (dev), empty for global (prod)
- `enabled`: Enable/disable bot globally

**Note:** Recap channel, announcement channel, and feature flags are now configured per-server in the database using commands

## API Endpoints

### Bot Config (`/api/discord-bot-config`)
- `GET /` - Get config
- `PUT /` - Update config
- `GET /status` - Bot status
- `POST /start` - Start bot
- `POST /stop` - Stop bot
- `POST /restart` - Restart bot

### Word Stats (`/api/word-stats`)
- `GET /guilds` - List all servers with stats
- `GET /guild/:id` - Get server's top words
- `DELETE /guild/:id` - Clear server's stats
- `GET /export` - Export all stats as JSON
- `POST /import` - Import stats from JSON

### Game Stats (`/api/game-stats`)
- `GET /guilds` - List all servers with game stats
- `GET /guild/:id` - Get server's game stats
- `GET /user/:userId` - Get user's global game stats
- `DELETE /guild/:id` - Clear server's game stats
- `GET /export` - Export all game stats as JSON
- `POST /import` - Import game stats from JSON

### Spotify Stats (`/api/spotify-stats`)
- `GET /guilds` - List all servers with Spotify stats
- `GET /guild/:id` - Get server's Spotify stats
- `GET /user/:userId` - Get user's global Spotify stats
- `DELETE /guild/:id` - Clear server's Spotify stats
- `GET /export` - Export all Spotify stats as JSON
- `POST /import` - Import Spotify stats from JSON

### Announcements (`/api/announcements`)
- `POST /` - Send announcement to all enabled servers
- `GET /guilds` - Get all guilds with announcements enabled

## Adding Commands

Slash command:
```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('name')
    .setDescription('Description'),

  async execute(interaction) {
    await interaction.reply('Response');
  },
};
```

Context menu command (right-click message):
```javascript
import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('name')
    .setType(ApplicationCommandType.Message),

  async execute(interaction) {
    const message = interaction.targetMessage;
    await message.reply('Response');
    await interaction.reply({ content: 'Done', ephemeral: true });
  },
};
```

## Required Intents

- Guilds
- GuildMessages
- GuildPresences
- MessageContent (enable in Discord Developer Portal)

## Privacy & GDPR Compliance

The bot includes comprehensive privacy features:

### User Controls
- Users can opt out of Spotify tracking with `/track optout type:Music`
- Users can opt out of game tracking with `/track optout type:Gaming`
- Users can disable streak DM notifications with `/track optout type:Streak DMs`
- Users can check their tracking status with `/track status`
- Users can delete all their data with `/deletedata` (GDPR right to be forgotten)

### Server Controls
- Admins can disable tracking features per server with `/features toggle`
- Tracking is opt-in per server (must be explicitly enabled by admin)

### What is Tracked
- **Word Stats**: All messages in servers with word tracking enabled
- **Spotify Stats**: Spotify listening activity from Discord presence (when feature is enabled)
- **Game Stats**: Gaming activity from Discord presence (when feature is enabled)

### Data Storage
All data is stored in SQLite databases:
- `config/word-stats.db`
- `config/game-stats.db`
- `config/spotify-stats.db`
