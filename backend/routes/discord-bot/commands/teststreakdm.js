import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as gameStatsDb from '../gameStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('teststreakdm')
    .setDescription('Test the streak DM notification system (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const userId = interaction.user.id;

      const isEnabled = await gameStatsDb.isStreakDMsEnabled(userId);

      if (!isEnabled) {
        await interaction.editReply({
          embeds: [{
            title: 'Streak DMs Not Enabled',
            description: 'You need to enable streak DM notifications first.\n\nUse `/track streakdms enabled:Enable` to opt in.',
            color: 0xff5555
          }]
        });
        return;
      }

      const streaks = await gameStatsDb.getAllGameStreaks(userId);

      if (streaks.length === 0) {
        await interaction.editReply({
          embeds: [{
            title: 'No Streaks to Test',
            description: 'You don\'t have any active streaks to test with.\n\nPlay a game to start tracking!',
            color: 0xffa500
          }]
        });
        return;
      }

      const notifiableStreaks = streaks.filter(s => s.streak > 1);
      const oneDay = streaks.filter(s => s.streak === 1);

      try {
        const user = await interaction.client.users.fetch(userId);

        const streakText = streaks
          .map(s => `🔥 **${s.streak}-day streak**: ${s.game_name}`)
          .join('\n');

        const embed = {
          title: 'Your Gaming Streaks Updated!',
          description: streakText,
          color: 0x39ff14,
          footer: {
            text: 'Hey you, yes you, 67.'
          },
          timestamp: new Date().toISOString()
        };

        await user.send({ embeds: [embed] });

        const fields = [];

        if (notifiableStreaks.length > 0) {
          fields.push({
            name: 'Streaks Included (2+ days - will trigger in production)',
            value: notifiableStreaks.map(s => `${s.game_name}: ${s.streak} days`).join('\n'),
            inline: false
          });
        }

        if (oneDay.length > 0) {
          fields.push({
            name: 'Included for Testing Only (1-day - won\'t trigger in production)',
            value: oneDay.map(s => `${s.game_name}: ${s.streak} day`).join('\n'),
            inline: false
          });
        }

        await interaction.editReply({
          embeds: [{
            title: 'Test DM Sent!',
            description: 'Check your DMs to see the streak notification.\n\nNote: In production, only 2+ day streaks trigger DMs.',
            color: 0x39ff14,
            fields
          }]
        });

        console.log(`[Test Streak DM] Sent test DM to user ${userId}`);
      } catch (dmError) {
        await interaction.editReply({
          embeds: [{
            title: 'Failed to Send DM',
            description: `Could not send you a DM. This might be because:\n- You have DMs disabled from server members\n- You have blocked the bot\n- Your privacy settings prevent DMs\n\nError: ${dmError.message}`,
            color: 0xff5555
          }]
        });
        console.error(`[Test Streak DM] Failed to send DM to user ${userId}:`, dmError);
      }
    } catch (error) {
      console.error('Error in teststreakdm command:', error);
      await interaction.editReply({
        embeds: [{
          title: 'Error',
          description: 'An error occurred while testing streak DM notifications.',
          color: 0xff5555
        }]
      });
    }
  },
};
