import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spencer')
    .setDescription('Replies with a gay thing!')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    await interaction.reply('<@533050464535576577> number one yaoi enthusiast');
  },
};
