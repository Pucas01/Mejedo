import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('evie')
    .setDescription('Replies with something, uhhh uhh aketchi would say!')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    await interaction.deferReply();
    await interaction.deleteReply();

    const channel = interaction.channel;

    await channel.send('Teammates!? Friends!? To hell with that! Why am I inferior to you!? I was extremely particular about my life, my grades, my public image! So someone would want me around!');

    await new Promise(resolve => setTimeout(resolve, 2000));
    await channel.send('I am an ace detective! A celebrity! But you... You\'re just some criminal trash living in an attic!?');

    await new Promise(resolve => setTimeout(resolve, 2000));
    await channel.send('So how!? How does someone like you have things I don\'t!? How can such a worthless piece of trash be more special than me!?');

    await new Promise(resolve => setTimeout(resolve, 2000));
    await channel.send('This argument is MEANINGLESS!!');
  },
};
