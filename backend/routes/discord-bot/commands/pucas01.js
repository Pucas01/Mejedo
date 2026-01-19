import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pucas01')
    .setDescription('Sends something special!'),

  async execute(interaction) {
    await interaction.reply('https://cdn.pucas01.com/hIXdHkfF/AoD-Dance.mp4');
  },
};
