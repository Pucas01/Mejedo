import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skysill')
    .setDescription('Replies with something!')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    const spinner = ['|', '/', '-', '\\'];
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Readying animation with spinner
    await interaction.reply('Readying the 50/50... |');
    for (let i = 0; i < 6; i++) {
      await delay(250);
      await interaction.editReply(`Readying the 50/50... ${spinner[(i + 1) % 4]}`);
    }

    // Pulling animation with spinner
    for (let i = 0; i < 8; i++) {
      await delay(200);
      await interaction.editReply(`Pulling... ${spinner[i % 4]}`);
    }

    // Randomly choose between two messages
    const messages = [
      'I fricking hate skysill!',
      'Im a big fan of Goopie Megpoid!'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    await interaction.editReply(`${randomMessage}`);
  },
};
