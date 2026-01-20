# Discord Bot

## Commands

| Command | Type | Description |
|---------|------|-------------|
| `/wordstats` | Slash | View word usage stats (server/personal, filtered/unfiltered) |
| `/wordstats user:@someone` | Slash | View another user's stats |
| `/forcerecap` | Slash | Force post weekly recap (admin only) |
| `/skysill` | Slash | 50/50 spinner animation |
| `/evie` | Slash | Akechi rant |
| `/pucas01` | Slash | Link |
| `/spencer` | Slash | User mention |
| `/cookieclouds` | Slash | Twitch promo |
| `retro` | Context Menu | Right-click message -> Apps -> retro. Replies "Ain't no way" |

## Word Stats System

Tracks word usage across all messages (excluding bots).

### Features
- Per-user and server-wide stats
- Common words filtered by default (the, a, is, etc.)
- Weekly recap posted automatically (Sunday noon)
- All-time stats persist, weekly stats reset after recap

### Config
Set `recapChannelId` in admin panel for weekly recaps.

### Database
Stored in `config/word-stats.db` (SQLite).

## Files

```
backend/routes/discord-bot/
├── bot.js              # Main bot class
├── config.js           # Config API routes
├── wordTracker.js      # Message tracking & weekly recap
├── wordStatsDb.js      # Database functions
├── wordStatsApi.js     # Stats API routes
└── commands/
    ├── wordstats.js
    ├── forcerecap.js
    ├── skysill.js
    ├── retro.js
    ├── evie.js
    ├── pucas01.js
    ├── spencer.js
    └── cookieclouds.js
```

## Config

`config/discord-bot.json`:
```json
{
  "token": "BOT_TOKEN",
  "clientId": "CLIENT_ID",
  "guildId": "",
  "recapChannelId": "",
  "enabled": true
}
```

- `guildId`: Set for instant command updates (dev), empty for global (prod)
- `recapChannelId`: Channel for weekly word stats recap

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
