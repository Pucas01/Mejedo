import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { postWeeklyRecap } from '../wordTracker.js';
import { getGuildSettings } from '../wordStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('forcerecap')
    .setDescription('Force post the weekly word stats recap')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guildId = interaction.guild.id;

      // Get guild settings from database
      const settings = await getGuildSettings(guildId);

      if (!settings || !settings.recap_channel_id) {
        await interaction.editReply('No recap channel configured for this server. Use `/setrecap` to configure it first.');
        return;
      }

      await postWeeklyRecap(interaction.client, settings.recap_channel_id, false);
      await interaction.editReply('Word stats preview posted (stats where not reset btw).');
    } catch (error) {
      console.error('Error forcing recap:', error);
      await interaction.editReply('Failed to post recap. Check if the channel is valid and the bot has permissions.');
    }
  },
};
