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

    // Roll for outcome: 5% Teto, 47.5% skysill hate, 47.5% Gumi love
    const roll = Math.random() * 100;

    if (roll < 5) {
      // 5% chance - Teto special
      for (let i = 0; i < 6; i++) {
        await delay(200);
        await interaction.editReply(`Capturing radiance Triggered ${spinner[i % 4]}`);
      }
      await interaction.editReply({
        content: '',
        files: ['https://cdn.pucas01.com/gRCJscEM/Gumi-Teto-Store.png']
      });
    } else if (roll < 52.5) {
      // 47.5% chance
      await interaction.editReply(`Skysill fucking hates <@${interaction.user.id}>`);
    } else {
      // 47.5% chance
      await interaction.editReply('Im a big fan of Goopie Megpoid!');
    }
  },
};
