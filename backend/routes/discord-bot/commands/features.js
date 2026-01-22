import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildSettings, updateFeatureFlags } from '../wordStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('features')
    .setDescription('Enable or disable bot features for this server (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View current feature settings')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle a feature on or off')
        .addStringOption(option =>
          option
            .setName('feature')
            .setDescription('Feature to toggle')
            .setRequired(true)
            .addChoices(
              { name: 'Word Tracking', value: 'word_tracking' },
              { name: 'Spotify Tracking', value: 'spotify_tracking' },
              { name: 'Announcements', value: 'announcements' }
            )
        )
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'status') {
      // Show current status
      const settings = await getGuildSettings(guildId);

      const wordEnabled = settings?.word_tracking_enabled === 1;
      const spotifyEnabled = settings?.spotify_tracking_enabled === 1;
      const announcementsEnabled = settings?.announcements_enabled === 1;

      const embed = {
        title: 'Server Feature Settings',
        description: `Feature status for **${interaction.guild.name}**`,
        color: 0x39ff14,
        fields: [
          {
            name: 'Word Tracking',
            value: wordEnabled ? '**Enabled**' : '**Disabled**',
            inline: true
          },
          {
            name: 'Spotify Tracking',
            value: spotifyEnabled ? '**Enabled**' : '**Disabled**',
            inline: true
          },
          {
            name: 'Announcements',
            value: announcementsEnabled ? '**Enabled**' : '**Disabled**',
            inline: true
          }
        ],
        footer: {
          text: 'Use /features toggle to change settings'
        }
      };

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (subcommand === 'toggle') {
      // Toggle a feature
      const feature = interaction.options.getString('feature');
      const enabled = interaction.options.getBoolean('enabled');

      // Get current settings
      const settings = await getGuildSettings(guildId);
      const currentWordEnabled = settings?.word_tracking_enabled === 1;
      const currentSpotifyEnabled = settings?.spotify_tracking_enabled === 1;
      const currentAnnouncementsEnabled = settings?.announcements_enabled === 1;

      // Update the requested feature
      let newWordEnabled = currentWordEnabled;
      let newSpotifyEnabled = currentSpotifyEnabled;
      let newAnnouncementsEnabled = currentAnnouncementsEnabled;

      if (feature === 'word_tracking') {
        newWordEnabled = enabled;
      } else if (feature === 'spotify_tracking') {
        newSpotifyEnabled = enabled;
      } else if (feature === 'announcements') {
        newAnnouncementsEnabled = enabled;
      }

      // Save to database
      await updateFeatureFlags(guildId, newWordEnabled, newSpotifyEnabled, newAnnouncementsEnabled);

      const featureName = feature === 'word_tracking' ? 'Word Tracking'
        : feature === 'spotify_tracking' ? 'Spotify Tracking'
        : 'Announcements';
      const statusText = enabled ? '**enabled**' : '**disabled**';

      const embed = {
        title: `Feature ${enabled ? 'Enabled' : 'Disabled'}`,
        description: `${featureName} has been ${statusText} for **${interaction.guild.name}**`,
        color: enabled ? 0x39ff14 : 0xff5555,
        fields: [],
        footer: {
          text: 'Use /features status to view all settings'
        }
      };

      // Add helpful info based on what was toggled
      if (feature === 'word_tracking' && enabled) {
        embed.fields.push({
          name: 'Word Tracking',
          value: 'The bot will now track word usage in all messages. Use `/wordstats` to view stats.'
        });
      } else if (feature === 'spotify_tracking' && enabled) {
        embed.fields.push({
          name: 'Spotify Tracking',
          value: 'The bot will now track Spotify listening. Use `/trackmusic add @user` to add users to tracking.'
        });
      } else if (feature === 'announcements' && enabled) {
        embed.fields.push({
          name: 'Announcements',
          value: 'The bot will now receive announcements. Use `/setannouncements` to configure the announcement channel.'
        });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
