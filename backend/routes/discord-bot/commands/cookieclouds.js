import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cookieclouds')
    .setDescription('Follow cookieclouds on Twitch!')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    await interaction.reply('follow cookieclouds on twitch https://twitch.tv/cookiecloudss');
  },
};
