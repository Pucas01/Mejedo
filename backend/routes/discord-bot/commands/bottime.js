import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bottime')
    .setDescription('Show the current bot time and when streaks reset')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    const now = new Date();

    // Current UTC time
    const utcTime = now.toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    const utcDate = now.toISOString().split('T')[0];

    // Calculate time until next midnight UTC
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight - now;
    const hoursUntil = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));

    const embed = new EmbedBuilder()
      .setTitle('Bot Time & Streak Reset')
      .setColor(0x39ff14)
      .setDescription('The bot uses **UTC timezone** for all streak calculations.')
      .addFields(
        {
          name: 'Current Bot Time (UTC)',
          value: `\`${utcTime}\``,
          inline: false,
        },
        {
          name: 'Current UTC Date',
          value: `\`${utcDate}\``,
          inline: false,
        },
        {
          name: 'Time Until Next Day',
          value: `Streaks reset in **${hoursUntil}h ${minutesUntil}m**`,
          inline: false,
        },
      )
      .setFooter({ text: 'hey guys its me pucas01 and im a big fan of the hit game Persona 5 dancing in starlight' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
