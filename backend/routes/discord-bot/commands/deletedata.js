import { SlashCommandBuilder } from 'discord.js';
import { deleteAllUserData } from '../spotifyStatsDb.js';
import { deleteAllUserWordData } from '../wordStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('deletedata')
    .setDescription('Permanently delete all your data from the bot (GDPR compliance)')
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    const user = interaction.user;

    // Create confirmation embed
    const confirmEmbed = {
      title: '⚠️ Delete All Your Data',
      description: `This will **permanently delete** all data the bot has collected about you.`,
      color: 0xff4444,
      fields: [
        {
          name: 'What will be deleted:',
          value: `• All Spotify listening history (across all servers)
• All word usage statistics (across all servers)
• Your opt-out/opt-in status
• Your tracked user status
• Everything associated with your Discord ID`,
          inline: false
        },
        {
          name: '⚠️ This action is IRREVERSIBLE',
          value: 'Once deleted, this data **cannot be recovered**.',
          inline: false
        },
        {
          name: 'How to proceed:',
          value: `Type \`CONFIRM DELETE\` in the next message to proceed.
Type anything else to cancel.`,
          inline: false
        }
      ],
      footer: {
        text: 'You have 60 seconds to respond'
      }
    };

    await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

    // Wait for confirmation message
    try {
      const filter = (m) => m.author.id === user.id;
      const collected = await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000, // 60 seconds
        errors: ['time']
      });

      const response = collected.first();
      const content = response.content.trim();

      // Delete the user's confirmation message
      try {
        await response.delete();
      } catch (err) {
        // Ignore if we can't delete (missing permissions)
      }

      if (content !== 'CONFIRM DELETE') {
        await interaction.followUp({
          content: '❌ Data deletion cancelled. Your data has not been deleted.',
          ephemeral: true
        });
        return;
      }

      // User confirmed - delete all data
      await interaction.followUp({
        content: '🗑️ Deleting your data... This may take a moment.',
        ephemeral: true
      });

      try {
        // Delete Spotify data
        await deleteAllUserData(user.id);

        // Delete word stats data
        await deleteAllUserWordData(user.id);

        // Success message
        const successEmbed = {
          title: '✅ Data Deletion Complete',
          description: 'All your data has been permanently deleted from the bot.',
          color: 0x00ff00,
          fields: [
            {
              name: 'What was deleted:',
              value: `• All Spotify listening history
• All word usage statistics
• All tracking preferences
• All associated data`,
              inline: false
            },
            {
              name: 'What happens now:',
              value: `• If Spotify tracking is enabled in this server, you will be tracked again by default (you were opted out)
• You can opt out again with \`/trackmusic optout\`
• If you want to stop word tracking, ask a server admin to disable the feature`,
              inline: false
            }
          ],
          footer: {
            text: 'GDPR compliance - Right to be forgotten'
          }
        };

        await interaction.editReply({ content: null, embeds: [successEmbed] });

        console.log(`[GDPR] User ${user.username} (${user.id}) deleted all their data`);
      } catch (error) {
        console.error('[GDPR] Error deleting user data:', error);
        await interaction.editReply({
          content: '❌ An error occurred while deleting your data. Please contact a server administrator.',
          ephemeral: true
        });
      }
    } catch (error) {
      // Timeout or other error
      if (error.message === 'time') {
        await interaction.followUp({
          content: '⏱️ Confirmation timed out. Data deletion cancelled.',
          ephemeral: true
        });
      } else {
        console.error('[GDPR] Error in deletedata command:', error);
        await interaction.followUp({
          content: '❌ An error occurred. Data deletion cancelled.',
          ephemeral: true
        });
      }
    }
  },
};
