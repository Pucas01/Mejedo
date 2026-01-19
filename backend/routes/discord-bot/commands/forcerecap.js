import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { postWeeklyRecap } from '../wordTracker.js';
import fs from 'fs';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('forcerecap')
    .setDescription('Force post the weekly word stats recap')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Get recap channel from config
      const configPath = path.join(process.cwd(), 'config', 'discord-bot.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      if (!config.recapChannelId) {
        await interaction.editReply('No recap channel configured. Set it in the admin panel first.');
        return;
      }

      await postWeeklyRecap(interaction.client, config.recapChannelId);
      await interaction.editReply('Weekly recap posted and stats reset.');
    } catch (error) {
      console.error('Error forcing recap:', error);
      await interaction.editReply('Failed to post recap. Check if the channel ID is valid.');
    }
  },
};
