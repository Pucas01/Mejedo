# Discord Bot System

A fully integrated Discord bot with visual admin UI and webhook notifications.

## Features

- ✅ Slash command support (`/hello`, `/test`)
- ✅ Auto-loading commands from files
- ✅ Visual admin UI for configuration (no terminal commands needed!)
- ✅ Webhook notifications for security events
- ✅ Test command to verify webhook setup
- ✅ Config file auto-creation on startup
- ✅ Integrated with Express backend

## File Structure

```
backend/
├── routes/
│   └── discord-bot/
│       ├── bot.js           # Bot initialization
│       ├── config.js        # Config API routes
│       ├── commands/        # Slash commands
│       │   └── hello.js     # Example command
│       └── README.md        # Setup guide
└── config/
    └── discord-bot.json     # Bot configuration (auto-created)
```

## Admin Management

Access the visual admin panel at `/admin` on your website (login required).

### Setup Workflow

1. **Create Discord Application:**
   - Go to https://discord.com/developers/applications
   - Create new application
   - Add a bot and copy the bot token
   - Copy the client ID from OAuth2 section

2. **Configure Bot via Admin UI:**
   - Navigate to `/admin` and login
   - Scroll down to "Discord Bot Settings" panel
   - Enter your bot token and client ID
   - (Optional) Enter your server ID for faster command updates during development
   - Check "Enable Discord Bot"
   - Click "Save Bot Configuration"

3. **Configure Webhook Notifications (Optional):**
   - In the same panel, scroll to "Webhook Notifications"
   - Create a webhook in your Discord server (Server Settings → Integrations → Webhooks)
   - Paste the webhook URL
   - (Optional) Add your Discord user ID to get mentioned in notifications
   - Check "Enable Webhook Notifications"
   - Click "Save Webhook Settings"

4. **Invite Bot to Server:**
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877991936&scope=bot%20applications.commands
   ```
   Replace `YOUR_CLIENT_ID` with your actual client ID. This includes permissions for: View Channels, Send Messages, Use Slash Commands, and Read Message History.

5. **Restart Server:**
   ```bash
   npm run server
   ```

6. **Test in Discord:**
   - Type `/hello` for a hello world message
   - Type `/test` to send a test webhook notification

## Adding Commands

Create a new file in `backend/routes/discord-bot/commands/`:

```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('yourcommand')
    .setDescription('Your command description'),

  async execute(interaction) {
    await interaction.reply('Your response!');
  },
};
```

Commands are automatically loaded on server restart.

## API Endpoints

**Admin Only (requires authentication):**

- `GET /api/discord-bot-config` - Get current config (token masked)
- `PUT /api/discord-bot-config` - Update config
- `GET /api/discord-bot-config/status` - Get bot status

## Configuration File

`backend/config/discord-bot.json`:

```json
{
  "token": "YOUR_BOT_TOKEN",
  "clientId": "YOUR_CLIENT_ID",
  "guildId": "YOUR_GUILD_ID",
  "enabled": true
}
```

- `token`: Discord bot token
- `clientId`: Application client ID
- `guildId`: (Optional) Server ID for instant command updates during development
- `enabled`: Set to `true` to start bot, `false` to disable

## Security

- Admin terminal requires login
- Bot token is never sent to frontend (masked as `***SET***`)
- All config endpoints require authentication
- Config file is created with permissions 644

## Troubleshooting

**Bot doesn't respond:**
- Check `bot status` in admin terminal
- Verify bot is enabled and configured
- Check server logs for errors
- Restart the server after config changes

**Commands don't appear:**
- Global commands take up to 1 hour to propagate
- Use `guildId` for instant updates during development
- Restart Discord client to refresh command list

**Permission errors:**
- Ensure bot has "Send Messages" permission
- Check bot role is above restricted roles
- Re-invite bot with correct permissions

## Development vs Production

**Development:**
```bash
bot guildid YOUR_TEST_SERVER_ID
```
- Commands appear instantly in that server only
- Fast iteration

**Production:**
```bash
bot guildid ""  # Empty string for global
```
- Commands available in all servers
- Takes up to 1 hour to update

## Integration with Backend

The bot runs in the same process as the Express server:
1. Config file created on server startup
2. Bot initialized after Express server starts
3. Can share database, routes, and utilities with backend
4. Access via `discordBot.getClient()` if needed

## Example: Adding a Command with Options

```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echoes your message')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message to echo')
        .setRequired(true)
    ),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    await interaction.reply(message);
  },
};
```

## Resources

- [Discord.js Guide](https://discordjs.guide/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Slash Commands](https://discord.com/developers/docs/interactions/application-commands)
