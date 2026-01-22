import { SlashCommandBuilder } from 'discord.js';
import {
  getTopTracks,
  getTopArtists,
  getGlobalUserStats,
  getGlobalTopTracksForUser,
  getGlobalTopArtistsForUser,
  isUserTrackedGlobally,
} from '../spotifyStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spotifystats')
    .setDescription('View Spotify listening stats')
    .addStringOption(option =>
      option.setName('scope')
        .setDescription('View server or personal stats')
        .setRequired(false)
        .addChoices(
          { name: 'Server', value: 'server' },
          { name: 'Personal', value: 'personal' }
        ))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('View stats for a specific user')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Show tracks, artists, or both')
        .setRequired(false)
        .addChoices(
          { name: 'Tracks & Artists', value: 'both' },
          { name: 'Tracks Only', value: 'tracks' },
          { name: 'Artists Only', value: 'artists' }
        )),

  async execute(interaction) {
    const scope = interaction.options.getString('scope') || 'server';
    const targetUser = interaction.options.getUser('user');
    const type = interaction.options.getString('type') || 'both';
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    try {
      let title;
      let description;
      let fields = [];
      let thumbnail = null;

      if (targetUser) {
        // View specific user's stats (global across all servers)
        const tracked = await isUserTrackedGlobally(targetUser.id);
        if (!tracked) {
          await interaction.editReply({
            content: `${targetUser.username} is not being tracked in any server yet.`
          });
          return;
        }

        const stats = await getGlobalUserStats(targetUser.id);
        if (stats.totalListens === 0) {
          await interaction.editReply({
            content: `${targetUser.username} hasn't listened to any songs yet (or hasn't connected Spotify to Discord).`
          });
          return;
        }

        title = `${targetUser.username}'s Spotify Stats`;
        description = `Total: **${stats.totalListens}** plays • **${stats.uniqueTracks}** tracks • **${stats.uniqueArtists}** artists\n*Showing global stats across all servers*`;
        thumbnail = { url: targetUser.displayAvatarURL() };

        if (type === 'both' || type === 'tracks') {
          const topTracks = await getGlobalTopTracksForUser(targetUser.id, 15);
          const trackList = topTracks.length > 0
            ? topTracks.map((t, i) => `${i + 1}. **${t.track_name}** - ${t.artist} (${t.play_count} plays)`).join('\n')
            : 'No tracks yet';
          fields.push({ name: 'Top Tracks', value: trackList, inline: false });
        }

        if (type === 'both' || type === 'artists') {
          const topArtists = await getGlobalTopArtistsForUser(targetUser.id, 10);
          const artistList = topArtists.length > 0
            ? topArtists.map((a, i) => `${i + 1}. **${a.artist}** (${a.play_count} plays • ${a.unique_tracks} tracks)`).join('\n')
            : 'No artists yet';
          fields.push({ name: 'Top Artists', value: artistList, inline: false });
        }

      } else if (scope === 'personal') {
        // View own stats (global across all servers)
        const tracked = await isUserTrackedGlobally(interaction.user.id);
        if (!tracked) {
          await interaction.editReply({
            content: `You are not being tracked in any server yet.`
          });
          return;
        }

        const stats = await getGlobalUserStats(interaction.user.id);
        if (stats.totalListens === 0) {
          await interaction.editReply({
            content: `You haven't listened to any songs yet (or haven't connected Spotify to Discord).`
          });
          return;
        }

        title = `Your Spotify Stats`;
        description = `Total: **${stats.totalListens}** plays • **${stats.uniqueTracks}** tracks • **${stats.uniqueArtists}** artists\n*Showing global stats across all servers*`;
        thumbnail = { url: interaction.user.displayAvatarURL() };

        if (type === 'both' || type === 'tracks') {
          const topTracks = await getGlobalTopTracksForUser(interaction.user.id, 15);
          const trackList = topTracks.length > 0
            ? topTracks.map((t, i) => `${i + 1}. **${t.track_name}** - ${t.artist} (${t.play_count} plays)`).join('\n')
            : 'No tracks yet';
          fields.push({ name: 'Top Tracks', value: trackList, inline: false });
        }

        if (type === 'both' || type === 'artists') {
          const topArtists = await getGlobalTopArtistsForUser(interaction.user.id, 10);
          const artistList = topArtists.length > 0
            ? topArtists.map((a, i) => `${i + 1}. **${a.artist}** (${a.play_count} plays • ${a.unique_tracks} tracks)`).join('\n')
            : 'No artists yet';
          fields.push({ name: 'Top Artists', value: artistList, inline: false });
        }

      } else {
        // Server-wide stats
        title = `Server Spotify Stats`;
        description = `What everyone has been listening to on ${interaction.guild.name}`;

        if (type === 'both' || type === 'tracks') {
          const topTracks = await getTopTracks(guildId, 15);
          if (topTracks.length === 0) {
            await interaction.editReply({
              content: 'No one has listened to music yet! Make sure tracked users have Spotify connected to Discord.'
            });
            return;
          }

          const trackList = topTracks.map((t, i) => {
            const listeners = t.unique_listeners > 1 ? ` • ${t.unique_listeners} listeners` : '';
            return `${i + 1}. **${t.track_name}** - ${t.artist} (${t.play_count} plays${listeners})`;
          }).join('\n');
          fields.push({ name: 'Top Tracks', value: trackList, inline: false });
        }

        if (type === 'both' || type === 'artists') {
          const topArtists = await getTopArtists(guildId, 15);
          if (topArtists.length === 0 && type === 'artists') {
            await interaction.editReply({
              content: 'No one has listened to music yet! Make sure tracked users have Spotify connected to Discord.'
            });
            return;
          }

          if (topArtists.length > 0) {
            const artistList = topArtists.map((a, i) => {
              const listeners = a.unique_listeners > 1 ? ` • ${a.unique_listeners} listeners` : '';
              return `${i + 1}. **${a.artist}** (${a.play_count} plays • ${a.unique_tracks} tracks${listeners})`;
            }).join('\n');
            fields.push({ name: 'Top Artists', value: artistList, inline: false });
          }
        }
      }

      const embed = {
        title,
        description,
        color: 0x1db954, // Spotify green
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: 'All-time statistics' }
      };

      if (thumbnail) {
        embed.thumbnail = thumbnail;
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching Spotify stats:', error);
      await interaction.editReply('An error occurred while fetching Spotify stats.');
    }
  },
};
