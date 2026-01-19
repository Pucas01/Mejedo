import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spencer')
    .setDescription('Replies with something!'),

  async execute(interaction) {
    await interaction.reply('<@533050464535576577> number one yaoi enthusiast');
  },
};
