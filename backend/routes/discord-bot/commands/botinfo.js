import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

function formatUptime(uptime) {
  const seconds = Math.floor(uptime / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export default {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('View bot information and statistics'),

  async execute(interaction) {
    const client = interaction.client;

    const embed = new EmbedBuilder()
      .setColor('#39ff14')
      .setTitle('PucasBot Information')
      .setDescription('Activity tracking bot for gaming, music, and chat statistics.')
      .addFields(
        {
          name: 'Bot Statistics',
          value:
            `**Uptime:** ${formatUptime(client.uptime)}\n` +
            `**Servers:** ${client.guilds.cache.size}\n` +
            `**Users:** ${client.users.cache.size}\n` +
            `**Ping:** ${client.ws.ping}ms`,
          inline: true
        },
        {
          name: 'Links',
          value:
            '[Website](https://pucas01.com)\n' +
            '[GitHub](https://github.com/pucas01/mejedo)\n',
          inline: false
        }
      )
      .setFooter({
        text: 'Use /help to see all commands',
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
