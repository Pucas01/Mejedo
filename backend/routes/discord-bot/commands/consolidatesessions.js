import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as gameStatsDb from '../gameStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('consolidatesessions')
    .setDescription('Merge duplicate game sessions caused by checkpoint system (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const embed = {
        title: 'Consolidating Game Sessions...',
        description: 'Merging duplicate sessions caused by the checkpoint system. This may take a moment...',
        color: 0xffa500,
      };

      await interaction.editReply({ embeds: [embed] });

      // Run consolidation
      const mergedCount = await gameStatsDb.consolidateDuplicateSessions();

      const resultEmbed = {
        title: 'Session Consolidation Complete',
        description: `Successfully merged **${mergedCount}** duplicate sessions.`,
        color: 0x39ff14,
        fields: [
          {
            name: 'What was fixed?',
            value: 'Sessions of the same game that were within 6 minutes of each other have been merged into single sessions.',
            inline: false,
          },
          {
            name: 'Impact',
            value: 'Your stats and hours played remain the same, but session counts are now accurate.',
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [resultEmbed] });
      console.log(`[Consolidate] Admin ${interaction.user.username} ran session consolidation, merged ${mergedCount} sessions`);
    } catch (error) {
      console.error('Error in consolidatesessions command:', error);
      await interaction.editReply({
        embeds: [{
          title: 'Error',
          description: `An error occurred while consolidating sessions: ${error.message}`,
          color: 0xff5555,
        }],
      });
    }
  },
};
