import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cookieclouds')
    .setDescription('Follow cookieclouds on Twitch!'),

  async execute(interaction) {
    await interaction.reply('follow cookieclouds on twitch https://twitch.tv/cookiecloudss');
  },
};
