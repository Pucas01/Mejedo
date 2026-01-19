# Discord Bot

A simple Discord bot integrated into the Mejedo backend server with slash commands.

## Setup

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "Bot" section and click "Add Bot"
4. Under "Token", click "Reset Token" and copy it (you'll need this)
5. Navigate to the "OAuth2" section and copy the "Client ID"

### 2. Configure the Bot

Edit `backend/config/discord-bot.json`:

```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "guildId": "YOUR_SERVER_ID_HERE (optional)",
  "enabled": true
}
```

**Configuration Options:**
- `token`: Your bot token from the Discord Developer Portal
- `clientId`: Your application's client ID
- `guildId`: (Optional) Your Discord server ID for faster command registration during development. Leave empty for global commands.
- `enabled`: Set to `true` to start the bot, `false` to disable it

### 3. Get Your Guild (Server) ID

1. Enable Developer Mode in Discord: User Settings → Advanced → Developer Mode
2. Right-click your server name and click "Copy Server ID"

### 4. Invite the Bot to Your Server

Use this URL (replace `YOUR_CLIENT_ID` with your actual client ID):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot%20applications.commands
```

Required permissions:
- `applications.commands` - For slash commands
- `Send Messages` - To reply to commands

### 5. Start the Server

The bot will automatically start when you run the backend server:

```bash
npm run server
```

or

```bash
npm run dev
```

## Available Commands

### `/hello`
Replies with "Hello World! 👋"

## Adding New Commands

1. Create a new file in `backend/routes/discord-bot/commands/yourcommand.js`:

```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('yourcommand')
    .setDescription('Description of your command'),

  async execute(interaction) {
    await interaction.reply('Your response!');
  },
};
```

2. Restart the server - the command will be automatically loaded and registered

## Command Options

You can add options to your commands:

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

## Troubleshooting

### Bot doesn't respond to commands
- Make sure `enabled` is set to `true` in `discord-bot.json`
- Check that the bot token and client ID are correct
- Ensure the bot has been invited to your server with the correct permissions

### Commands don't show up
- If using `guildId`, commands should appear instantly
- If using global commands (no `guildId`), it can take up to 1 hour for commands to propagate
- Restart the Discord client to refresh the command list

### "Missing Access" error
- Make sure the bot has the "Send Messages" permission in the channel
- Check that the bot role is above any restricted roles

## Development vs Production

**Development (Faster):**
- Set `guildId` to your test server ID
- Commands register instantly
- Only available in that server

**Production (Global):**
- Leave `guildId` empty (`""`)
- Commands available in all servers
- Can take up to 1 hour to propagate

## File Structure

```
backend/routes/discord-bot/
├── bot.js              # Bot initialization and event handlers
├── commands/           # Slash commands
│   └── hello.js       # Example command
└── README.md          # This file
```
