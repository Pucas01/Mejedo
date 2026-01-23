import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { postWeeklyRecap } from '../wordTracker.js';
import { postSpotifyRecap } from '../spotifyTracker.js';
import { postGameRecap } from '../gameTracker.js';
import { getGuildSettings } from '../wordStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('forcerecap')
    .setDescription('Force post a weekly recap')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of recap to post')
        .setRequired(false)
        .addChoices(
          { name: 'Words', value: 'words' },
          { name: 'Music', value: 'music' },
          { name: 'Gaming', value: 'gaming' },
          { name: 'All', value: 'all' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guildId = interaction.guild.id;
      const type = interaction.options.getString('type') || 'all';

      // Get guild settings from database
      const settings = await getGuildSettings(guildId);

      if (!settings || !settings.recap_channel_id) {
        await interaction.editReply('No recap channel configured for this server. Use `/setrecap` to configure it first.');
        return;
      }

      let message = '';

      // Post word recap
      if (type === 'words' || type === 'all') {
        await postWeeklyRecap(interaction.client, settings.recap_channel_id, false);
        message += 'Word stats preview posted. ';
      }

      // Post music recap
      if (type === 'music' || type === 'all') {
        await postSpotifyRecap(interaction.client, settings.recap_channel_id, guildId, false);
        message += 'Music stats preview posted. ';
      }

      // Post gaming recap
      if (type === 'gaming' || type === 'all') {
        await postGameRecap(interaction.client, guildId);
        message += 'Gaming stats preview posted. ';
      }

      message += '(Stats were not reset)';
      await interaction.editReply(message);
    } catch (error) {
      console.error('Error forcing recap:', error);
      await interaction.editReply('Failed to post recap. Check if the channel is valid and the bot has permissions.');
    }
  },
};
