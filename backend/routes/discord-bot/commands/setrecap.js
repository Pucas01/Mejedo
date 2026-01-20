import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { setRecapChannel, getGuildSettings } from '../wordStatsDb.js';

const DAYS = [
  { name: 'Sunday', value: 0 },
  { name: 'Monday', value: 1 },
  { name: 'Tuesday', value: 2 },
  { name: 'Wednesday', value: 3 },
  { name: 'Thursday', value: 4 },
  { name: 'Friday', value: 5 },
  { name: 'Saturday', value: 6 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('setrecap')
    .setDescription('Set the channel and schedule for weekly word stats recaps')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel where recaps will be posted')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('day')
        .setDescription('Day of the week to post recap')
        .setRequired(false)
        .addChoices(...DAYS))
    .addIntegerOption(option =>
      option.setName('hour')
        .setDescription('Hour of day to post recap (24 hour format)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(23))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = interaction.options.getChannel('channel');
      const day = interaction.options.getInteger('day') ?? 0; // Default: Sunday
      const hour = interaction.options.getInteger('hour') ?? 12; // Default: 12:00
      const guildId = interaction.guild.id;

      // Save the settings to database
      await setRecapChannel(guildId, channel.id, day, hour);

      const dayName = DAYS.find(d => d.value === day)?.name || 'Sunday';
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;

      await interaction.editReply({
        content: `Weekly recap configured!\n\n**Channel:** <#${channel.id}>\n**Schedule:** Every ${dayName} at ${timeStr}\n\nStats will be posted automatically and reset after each recap.`
      });
    } catch (error) {
      console.error('Error setting recap channel:', error);
      await interaction.editReply('Failed to set recap channel. Please try again.');
    }
  },
};
