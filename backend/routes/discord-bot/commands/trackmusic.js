import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import {
  addTrackedUser,
  removeTrackedUser,
  getTrackedUsers,
  isUserTracked,
  setGlobalOptIn,
  removeGlobalOptIn,
  isGloballyOptedIn,
  getGuildsTrackingUser,
} from '../spotifyStatsDb.js';
import { isFeatureEnabled } from '../wordStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('trackmusic')
    .setDescription('Manage Spotify tracking for users')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a user to Spotify tracking (Admin only)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to track')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from Spotify tracking (Admin only)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to stop tracking')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all tracked users (Admin only)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('optin')
        .setDescription('Opt yourself into tracking across all servers you share with the bot')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('optout')
        .setDescription('Opt yourself out of tracking and remove your data from all servers')
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // Check admin permissions for admin-only subcommands
    const adminCommands = ['add', 'remove', 'list'];
    if (adminCommands.includes(subcommand)) {
      const member = interaction.member;
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: 'You need Administrator permissions to use this command.',
          ephemeral: true
        });
        return;
      }
    }

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user');

      // Check if already tracked in this guild
      const tracked = await isUserTracked(user.id, guildId);
      if (tracked) {
        await interaction.reply({
          content: `${user.username} is already being tracked in this server!`,
          ephemeral: true
        });
        return;
      }

      // Add user to tracking
      await addTrackedUser(user.id, guildId, user.username);

      await interaction.reply({
        content: `Now tracking Spotify activity for ${user.username}!\n\nMake sure they have Spotify connected to Discord for tracking to work.`,
        ephemeral: true
      });
    }
    else if (subcommand === 'remove') {
      const user = interaction.options.getUser('user');

      // Check if tracked in this guild
      const tracked = await isUserTracked(user.id, guildId);
      if (!tracked) {
        await interaction.reply({
          content: `${user.username} is not being tracked in this server.`,
          ephemeral: true
        });
        return;
      }

      // Remove user from tracking in this guild
      await removeTrackedUser(user.id, guildId);

      await interaction.reply({
        content: `Stopped tracking Spotify activity for ${user.username}.\n\nNote: Their existing stats remain in the database.`,
        ephemeral: true
      });
    }
    else if (subcommand === 'list') {
      const trackedUsers = await getTrackedUsers(guildId);

      if (trackedUsers.length === 0) {
        await interaction.reply({
          content: 'No users are currently being tracked in this server. Use `/trackmusic add @user` to start tracking.',
          ephemeral: true
        });
        return;
      }

      const userList = trackedUsers
        .map((u, i) => `${i + 1}. <@${u.user_id}> (${u.username})`)
        .join('\n');

      const embed = {
        title: 'Tracked Users',
        description: userList,
        color: 0x1db954,
        footer: { text: `${trackedUsers.length} user(s) being tracked` }
      };

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    else if (subcommand === 'optin') {
      // User opts themselves into tracking across all servers
      const user = interaction.user;
      const client = interaction.client;

      await interaction.deferReply({ ephemeral: true });

      // Set global opt-in flag so user is auto-tracked in future servers they join
      await setGlobalOptIn(user.id, user.username);

      const addedServers = [];
      const alreadyTrackedServers = [];
      const disabledServers = [];

      // Loop through all guilds the bot is in
      for (const [guildId, guild] of client.guilds.cache) {
        // Check if user is a member of this guild
        try {
          const member = await guild.members.fetch(user.id).catch(() => null);
          if (!member) continue; // User not in this guild

          // Check if Spotify tracking is enabled for this guild
          const enabled = await isFeatureEnabled(guildId, 'spotify_tracking');
          if (!enabled) {
            disabledServers.push(guild.name);
            continue;
          }

          // Check if already tracked
          const tracked = await isUserTracked(user.id, guildId);
          if (tracked) {
            alreadyTrackedServers.push(guild.name);
            continue;
          }

          // Add to tracking
          await addTrackedUser(user.id, guildId, user.username);
          addedServers.push(guild.name);
        } catch (error) {
          console.error(`Error checking guild ${guildId}:`, error);
        }
      }

      // Build response message
      let message = `Tracking opt-in complete!\n\n`;

      if (addedServers.length > 0) {
        message += `**Added to ${addedServers.length} server(s):**\n${addedServers.map(s => `• ${s}`).join('\n')}\n\n`;
      }

      if (alreadyTrackedServers.length > 0) {
        message += `**Already tracking in ${alreadyTrackedServers.length} server(s):**\n${alreadyTrackedServers.map(s => `• ${s}`).join('\n')}\n\n`;
      }

      if (disabledServers.length > 0) {
        message += `**Skipped ${disabledServers.length} server(s) (tracking disabled):**\n${disabledServers.map(s => `• ${s}`).join('\n')}\n\n`;
      }

      if (addedServers.length === 0 && alreadyTrackedServers.length === 0) {
        message = `No servers available for tracking. Either:\n• You're not in any servers with the bot\n• All servers have Spotify tracking disabled\n• You're already tracked everywhere`;
      }

      message += `\nMake sure you have Spotify connected to Discord for tracking to work!`;

      await interaction.editReply(message);
    }
    else if (subcommand === 'optout') {
      // User opts themselves out of tracking across all servers
      const user = interaction.user;
      const client = interaction.client;

      await interaction.deferReply({ ephemeral: true });

      // Check if user is globally opted in
      const globallyOptedIn = await isGloballyOptedIn(user.id);

      // Get all guilds where user is currently tracked
      const trackedGuilds = await getGuildsTrackingUser(user.id);

      if (trackedGuilds.length === 0 && !globallyOptedIn) {
        await interaction.editReply('You are not being tracked in any servers.');
        return;
      }

      const removedServers = [];

      // Remove from all tracked guilds
      for (const guildData of trackedGuilds) {
        const guildId = guildData.guild_id;
        try {
          const guild = client.guilds.cache.get(guildId);
          if (guild) {
            await removeTrackedUser(user.id, guildId);
            removedServers.push(guild.name);
          } else {
            // Guild not in cache, still remove from database
            await removeTrackedUser(user.id, guildId);
            removedServers.push(`Server ${guildId}`);
          }
        } catch (error) {
          console.error(`Error removing user from guild ${guildId}:`, error);
        }
      }

      // Remove global opt-in flag
      if (globallyOptedIn) {
        await removeGlobalOptIn(user.id);
      }

      // Build response message
      let message = `Tracking opt-out complete!\n\n`;

      if (removedServers.length > 0) {
        message += `**Removed from ${removedServers.length} server(s):**\n${removedServers.map(s => `• ${s}`).join('\n')}\n\n`;
      }

      if (globallyOptedIn) {
        message += `**Global opt-in disabled:** You will no longer be automatically tracked in new servers.\n\n`;
      }

      message += `Your listening history has been preserved in the database. To completely delete your data, contact a server administrator.`;

      await interaction.editReply(message);
    }
  },
};
