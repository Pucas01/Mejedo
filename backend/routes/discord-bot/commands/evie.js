import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('evie')
    .setDescription('Replies with something, uhhh uhh aketchi would say!'),

  async execute(interaction) {
    // Split Akechi's speech into 4 messages with delays
    await interaction.reply('Teammates!? Friends!? To hell with that! Why am I inferior to you!? I was extremely particular about my life, my grades, my public image! So someone would want me around!');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    await interaction.followUp('I am an ace detective! A celebrity! But you... You\'re just some criminal trash living in an attic!?');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    await interaction.followUp('So how!? How does someone like you have things I don\'t!? How can such a worthless piece of trash be more special than me!?');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    await interaction.followUp('This argument is MEANINGLESS!!');
  },
};
