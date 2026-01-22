import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setAnnouncementChannel, getGuildSettings } from '../wordStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setannouncements')
    .setDescription('Set the announcement channel for this server (Admin only)')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel where announcements will be posted')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // Verify it's a text channel
    if (channel.type !== 0) {
      await interaction.reply({
        content: 'Please select a text channel for announcements.',
        ephemeral: true
      });
      return;
    }

    // Check if bot has permissions to send messages in the channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has(['SendMessages', 'EmbedLinks'])) {
      await interaction.reply({
        content: `I don't have permission to send messages and embeds in ${channel}. Please grant me the necessary permissions first.`,
        ephemeral: true
      });
      return;
    }

    // Save to database
    await setAnnouncementChannel(guildId, channel.id);

    // Get current settings to check if announcements are enabled
    const settings = await getGuildSettings(guildId);
    const announcementsEnabled = settings?.announcements_enabled === 1;

    const embed = {
      title: 'Announcement Channel Set',
      description: `Announcements will now be posted to ${channel}`,
      color: 0x39ff14,
      fields: [],
      footer: {
        text: announcementsEnabled
          ? 'Announcements are enabled'
          : 'Use /features toggle to enable announcements'
      }
    };

    if (!announcementsEnabled) {
      embed.fields.push({
        name: 'Note',
        value: 'Announcements are currently **disabled**. Use `/features toggle` and select "Announcements" to enable them.'
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
