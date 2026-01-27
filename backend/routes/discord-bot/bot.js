import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerWordTracking, startWeeklyRecap, stopWeeklyRecap } from './wordTracker.js';
import { registerSpotifyTracking, startSpotifyRecap, stopSpotifyRecap } from './spotifyTracker.js';
import { setupGameTracking, initializeGameTracking, startGameRecap, stopGameRecap, stopGameTracking } from './gameTracker.js';
import { registerTemperatureConverter } from './temperatureConverter.js';
import { initializeGuildSettings, isFeatureEnabled } from './wordStatsDb.js';
import { migrateOptInToOptOut } from './spotifyStatsDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DiscordBot {
  constructor() {
    this.client = null;
    this.commands = new Collection();
  }

  async initialize(config) {
    if (!config.token) {
      console.log('Discord bot token not configured. Skipping bot initialization.');
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
      ]
    });

    await this.loadCommands();
    this.registerEvents();

    try {
      await this.client.login(config.token);
      console.log('Discord bot logged in successfully');

      await this.registerSlashCommands(config);

      registerWordTracking(this.client);
      startWeeklyRecap(this.client);

      registerSpotifyTracking(this.client);
      startSpotifyRecap(this.client);

      initializeGameTracking();
      setupGameTracking(this.client);
      startGameRecap(this.client);

      registerTemperatureConverter(this.client);

      await migrateOptInToOptOut();
      console.log('Spotify tracking migration completed (opt-in → opt-out)');
    } catch (error) {
      console.error('Failed to login Discord bot:', error);
    }
  }

  async loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');

    if (!fs.existsSync(commandsPath)) {
      console.log('No commands folder found');
      return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(`file://${filePath}`);

      if ('data' in command.default && 'execute' in command.default) {
        this.commands.set(command.default.data.name, command.default);
        console.log(`Loaded command: ${command.default.data.name}`);
      } else {
        console.log(`Warning: Command at ${filePath} is missing required "data" or "execute" property.`);
      }
    }
  }

  updateBotStatus() {
    if (!this.client || !this.client.user) return;

    const guildCount = this.client.guilds.cache.size;
    const serverText = guildCount === 1 ? 'server' : 'servers';

    this.client.user.setPresence({
      status: 'online',
      activities: [{ name: `Shoaling in ${guildCount} ${serverText}`, type: 0 }]
    });
  }

  registerEvents() {
    this.client.once('ready', () => {
      console.log(`Discord bot ready! Logged in as ${this.client.user.tag}`);

      this.updateBotStatus();

      this.client.guilds.cache.forEach(async (guild) => {
        try {
          await initializeGuildSettings(guild.id);
          console.log(`Initialized settings for guild: ${guild.name}`);
        } catch (error) {
          console.error(`Failed to initialize settings for guild ${guild.id}:`, error);
        }
      });
    });

    this.client.on('guildCreate', async (guild) => {
      console.log(`Bot joined new guild: ${guild.name} (${guild.id})`);
      try {
        await initializeGuildSettings(guild.id);
        console.log(`Initialized settings for new guild: ${guild.name} (features disabled by default)`);

        this.updateBotStatus();
      } catch (error) {
        console.error(`Failed to initialize settings for guild ${guild.id}:`, error);
      }
    });

    this.client.on('guildDelete', (guild) => {
      console.log(`Bot removed from guild: ${guild.name} (${guild.id})`);
      this.updateBotStatus();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isAutocomplete()) {
        const command = this.commands.get(interaction.commandName);

        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        if (!command.autocomplete) {
          return;
        }

        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error('Error handling autocomplete:', error);
        }
        return;
      }

      if (!interaction.isChatInputCommand() && !interaction.isMessageContextMenuCommand()) return;

      const command = this.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Error executing command:', error);
        const reply = {
          content: 'There was an error while executing this command!',
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    });
  }

  async registerSlashCommands(config) {
    if (!config.clientId) {
      console.log('Discord client ID not configured. Skipping slash command registration.');
      return;
    }

    const commands = [];
    for (const command of this.commands.values()) {
      commands.push(command.data.toJSON());
    }

    const rest = new REST().setToken(config.token);

    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      let data;
      if (config.guildId) {
        data = await rest.put(
          Routes.applicationGuildCommands(config.clientId, config.guildId),
          { body: commands },
        );
      } else {
        data = await rest.put(
          Routes.applicationCommands(config.clientId),
          { body: commands },
        );
      }

      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  getClient() {
    return this.client;
  }

  async stop() {
    if (this.client) {
      console.log('Stopping Discord bot...');

      stopWeeklyRecap();
      stopSpotifyRecap();
      stopGameRecap();
      console.log('Stopped scheduled tasks');

      try {
        const { flushPendingLogs } = await import('./spotifyTracker.js');
        await flushPendingLogs();
        console.log('Flushed pending Spotify logs');
      } catch (error) {
        console.error('Error flushing Spotify logs:', error);
      }

      try {
        stopGameTracking();
        console.log('Stopped game tracking');
      } catch (error) {
        console.error('Error stopping game tracking:', error);
      }

      try {
        if (this.client.user) {
          await this.client.user.setPresence({
            status: 'invisible',
            activities: []
          });
          console.log('Bot status set to offline');

          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error setting bot status to offline:', error);
      }

      await this.client.destroy();
      this.client = null;
      this.commands.clear();
      console.log('Discord bot stopped gracefully');
    }
  }

  isRunning() {
    return this.client !== null && this.client.isReady();
  }

  async broadcastAnnouncement(title, message, color = 0x39ff14) {
    if (!this.isRunning()) {
      throw new Error('Bot is not running');
    }

    const { getAllAnnouncementChannels } = await import('./wordStatsDb.js');
    const announcementChannels = await getAllAnnouncementChannels();

    const results = {
      successful: [],
      failed: []
    };

    for (const { guild_id, announcement_channel_id } of announcementChannels) {
      try {
        const channel = await this.client.channels.fetch(announcement_channel_id);

        if (!channel) {
          results.failed.push({
            guild_id,
            error: 'Channel not found'
          });
          continue;
        }

        const permissions = channel.permissionsFor(channel.guild.members.me);
        if (!permissions || !permissions.has(['SendMessages', 'EmbedLinks'])) {
          results.failed.push({
            guild_id,
            guild_name: channel.guild.name,
            error: 'Missing permissions'
          });
          continue;
        }

        const embed = {
          title,
          description: message,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: 'Mejedo Announcement' }
        };

        await channel.send({ embeds: [embed] });

        results.successful.push({
          guild_id,
          guild_name: channel.guild.name,
          channel_name: channel.name
        });

        console.log(`[Announcement] Sent to ${channel.guild.name} (#${channel.name})`);
      } catch (error) {
        console.error(`Error sending announcement to guild ${guild_id}:`, error);
        results.failed.push({
          guild_id,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default DiscordBot;
