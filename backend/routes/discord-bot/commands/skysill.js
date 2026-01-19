import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skysill')
    .setDescription('Replies with something!'),

  async execute(interaction) {
    // Show gambling animation with progressive dots
    await interaction.reply('Readying the 50/50.');

    // Add dots progressively
    await new Promise(resolve => setTimeout(resolve, 500));
    await interaction.editReply('Readying the 50/50..');

    await new Promise(resolve => setTimeout(resolve, 500));
    await interaction.editReply('Readying the 50/50...');

    await new Promise(resolve => setTimeout(resolve, 500));
    await interaction.editReply('Pulling.');

    await new Promise(resolve => setTimeout(resolve, 500));
    await interaction.editReply('Pulling..');

    await new Promise(resolve => setTimeout(resolve, 500));
    await interaction.editReply('Pulling...');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Randomly choose between two messages
    const messages = [
      'I fricking hate skysill!',
      'Im a big fan of Goopie Megpoid!'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    await interaction.editReply(`${randomMessage}`);
  },
};
