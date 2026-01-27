import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import * as gameStatsDb from '../gameStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('hopon')
    .setDescription('Request someone to hop on a game with you')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user you want to play with')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('game')
        .setDescription('The game you want to play')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription('Optional custom image to attach')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('imageurl')
        .setDescription('Or provide an image URL')
        .setRequired(false)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const targetUserId = interaction.options.get('user')?.value;

      if (!targetUserId) {
        return await interaction.respond([
          { name: 'Select a user first...', value: 'placeholder' }
        ]);
      }

      const games = await gameStatsDb.getGlobalTopGamesForUser(targetUserId, 25);

      if (!games || games.length === 0) {
        return await interaction.respond([
          { name: 'User has no recorded games', value: focusedValue || 'none' }
        ]);
      }

      const filtered = games
        .filter(game => game.game_name.toLowerCase().includes(focusedValue))
        .slice(0, 25)
        .map(game => ({
          name: `${game.game_name} (${(game.total_seconds / 3600).toFixed(1)}h played)`,
          value: game.game_name
        }));

      await interaction.respond(filtered.length > 0 ? filtered : [
        { name: focusedValue || 'Type to search...', value: focusedValue || 'search' }
      ]);
    } catch (error) {
      console.error('[Hop On] Autocomplete error:', error);
      try {
        await interaction.respond([
          { name: 'Error loading games', value: 'error' }
        ]);
      } catch (respondError) {
        console.error('[Hop On] Failed to respond to autocomplete:', respondError);
      }
    }
  },

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user');
    const gameName = interaction.options.getString('game');
    const imageAttachment = interaction.options.getAttachment('image');
    const imageUrl = interaction.options.getString('imageurl');

    if (targetUser.bot) {
      await interaction.editReply({
        embeds: [{
          title: 'Cannot Send Request',
          description: 'You cannot send hop on requests to bots.',
          color: 0xff5555
        }]
      });
      return;
    }

    let finalImageUrl = null;

    if (imageAttachment) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(imageAttachment.contentType)) {
        await interaction.editReply({
          embeds: [{
            title: 'Invalid Image',
            description: 'Please attach a valid image file (PNG, JPG, GIF, or WebP).',
            color: 0xff5555
          }]
        });
        return;
      }

      if (imageAttachment.size > 8 * 1024 * 1024) {
        await interaction.editReply({
          embeds: [{
            title: 'Image Too Large',
            description: 'Image must be smaller than 8MB.',
            color: 0xff5555
          }]
        });
        return;
      }

      finalImageUrl = imageAttachment.url;
    } else if (imageUrl) {
      try {
        const url = new URL(imageUrl);
        if (!url.protocol.startsWith('http')) {
          throw new Error('Invalid protocol');
        }
        finalImageUrl = imageUrl;
      } catch (error) {
        await interaction.editReply({
          embeds: [{
            title: 'Invalid Image URL',
            description: 'Please provide a valid HTTP/HTTPS image URL.',
            color: 0xff5555
          }]
        });
        return;
      }
    }

    try {
      const embed = {
        title: 'HOP ON THE GAME',
        description: `**${interaction.user.username}** wants you to HOP ON **${gameName}**!`,
        color: 0x39ff14,
        fields: [
          {
            name: 'Requested by',
            value: `<@${interaction.user.id}>`,
            inline: true
          },
          {
            name: 'Game',
            value: gameName,
            inline: true
          }
        ],
        footer: {
          text: 'Time to clock in and lock in!'
        },
        timestamp: new Date().toISOString()
      };

      if (finalImageUrl) {
        embed.image = {
          url: finalImageUrl
        };
      }

      await targetUser.send({ embeds: [embed] });

      await interaction.editReply({
        embeds: [{
          title: 'Request Sent!',
          description: `Successfully sent a HOP ON request to **${targetUser.username}** for **${gameName}**!`,
          color: 0x39ff14,
          fields: finalImageUrl ? [
            {
              name: 'Custom Image',
              value: 'Attached ✓',
              inline: true
            }
          ] : []
        }]
      });

      console.log(`[Hop On] ${interaction.user.username} requested ${targetUser.username} to play ${gameName}`);
    } catch (dmError) {
      await interaction.editReply({
        embeds: [{
          title: 'Failed to Send Request',
          description: `Could not send a DM to **${targetUser.username}**. They may have:\n- DMs disabled from server members\n- Blocked the bot\n- Privacy settings preventing DMs\n\nError: ${dmError.message}`,
          color: 0xff5555
        }]
      });
      console.error(`[Hop On] Failed to send DM to ${targetUser.username}:`, dmError);
    }
  },
};
