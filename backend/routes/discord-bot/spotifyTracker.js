import {
  logListenToAllGuilds,
  isUserTrackedGlobally,
  getWeeklyTopTracks,
  getWeeklyTopArtists,
  getWeeklyTopListeners,
  getWeeklyTotalCount,
  resetWeeklyStats,
} from './spotifyStatsDb.js';
import { isFeatureEnabled, getAllRecapChannels } from './wordStatsDb.js';

const currentlyPlaying = new Map();

let recapInterval = null;
let cleanupInterval = null;

const MAX_PLAYING_AGE_MS = 30 * 60 * 1000;

function cleanupStaleEntries() {
  const now = Date.now();
  const staleUserIds = [];

  for (const [userId, data] of currentlyPlaying.entries()) {
    if (now - data.startTime > MAX_PLAYING_AGE_MS) {
      staleUserIds.push(userId);
    }
  }

  staleUserIds.forEach(userId => currentlyPlaying.delete(userId));

  if (staleUserIds.length > 0) {
    console.log(`[Spotify Cleanup] Removed ${staleUserIds.length} stale entries from currentlyPlaying Map`);
  }
}

export function registerSpotifyTracking(client) {
  client.on('presenceUpdate', async (oldPresence, newPresence) => {
    try {
      if (!newPresence.guild) return;

      const userId = newPresence.userId;
      const guildId = newPresence.guild.id;

      const enabled = await isFeatureEnabled(guildId, 'spotify_tracking');
      if (!enabled) return;

      const tracked = await isUserTrackedGlobally(userId);
      if (!tracked) return;

      const spotifyActivity = newPresence.activities.find(
        (activity) => activity.name === 'Spotify' && activity.type === 2 // Type 2 = Listening
      );

      if (!spotifyActivity) {
        currentlyPlaying.delete(userId);
        return;
      }

      const trackId = spotifyActivity.syncId;
      const trackName = spotifyActivity.details;
      const artist = spotifyActivity.state;
      const album = spotifyActivity.assets?.largeText;

      const currentTrack = currentlyPlaying.get(userId);
      if (currentTrack && currentTrack.trackId === trackId) {
        return;
      }

      const startTime = Date.now();
      const durationMs = spotifyActivity.timestamps?.end
        ? spotifyActivity.timestamps.end - spotifyActivity.timestamps.start
        : null;

      currentlyPlaying.set(userId, {
        trackId,
        startTime,
        trackName,
        artist,
      });

      await logListenToAllGuilds(userId, trackName, artist, album, trackId, durationMs);

      console.log(`[Spotify] ${newPresence.user?.username} is listening to: ${trackName} by ${artist}`);
    } catch (error) {
      console.error('Error tracking Spotify presence:', error);
    }
  });

  console.log('Spotify tracking registered');
}

export function startSpotifyRecap(client) {
  cleanupInterval = setInterval(() => {
    cleanupStaleEntries();
  }, 10 * 60 * 1000);
  console.log('Spotify currentlyPlaying cleanup scheduler started');

  recapInterval = setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentMinute >= 5) return;

    const recapChannels = await getAllRecapChannels();

    for (const { guild_id, recap_channel_id, recap_day, recap_hour } of recapChannels) {
      const enabled = await isFeatureEnabled(guild_id, 'spotify_tracking');
      if (!enabled) continue;

      if (currentDay === recap_day && currentHour === recap_hour) {
        await postSpotifyRecap(client, recap_channel_id, guild_id, true);
      }
    }
  }, 5 * 60 * 1000);

  console.log('Spotify recap scheduler started');
}

export function stopSpotifyRecap() {
  if (recapInterval) {
    clearInterval(recapInterval);
    recapInterval = null;
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

function formatTrackList(tracks) {
  if (!tracks || tracks.length === 0) return 'No data yet';
  return tracks
    .map((t, i) => {
      const listeners = t.unique_listeners > 1 ? ` • ${t.unique_listeners} listeners` : '';
      return `${i + 1}. **${t.track_name}** - ${t.artist} (${t.play_count} plays${listeners})`;
    })
    .join('\n');
}

function formatArtistList(artists) {
  if (!artists || artists.length === 0) return 'No data yet';
  return artists
    .map((a, i) => {
      const listeners = a.unique_listeners > 1 ? ` • ${a.unique_listeners} listeners` : '';
      return `${i + 1}. **${a.artist}** (${a.play_count} plays${listeners})`;
    })
    .join('\n');
}

function formatListenerList(listeners, client) {
  if (!listeners || listeners.length === 0) return 'No data yet';
  return listeners
    .map((l, i) => {
      const tracksText = l.unique_tracks === 1 ? 'track' : 'tracks';
      return `${i + 1}. <@${l.user_id}> - ${l.listen_count} plays (${l.unique_tracks} unique ${tracksText})`;
    })
    .join('\n');
}

export async function postSpotifyRecap(client, channelId, guildId, resetStats = true) {
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error('Spotify recap channel not found:', channelId);
    return;
  }

  try {
    const topTracks = await getWeeklyTopTracks(guildId, 10);
    const topArtists = await getWeeklyTopArtists(guildId, 5);
    const topListeners = await getWeeklyTopListeners(guildId, 5);
    const totalListens = await getWeeklyTotalCount(guildId);

    if (totalListens === 0) {
      console.log('No Spotify data for weekly recap, skipping');
      return;
    }

    const embed = {
      title: resetStats ? 'Weekly Music Recap' : 'Music Stats Preview',
      color: 0x39ff14,
      fields: [
        { name: 'Top Tracks', value: formatTrackList(topTracks), inline: false },
        { name: 'Top Artists', value: formatArtistList(topArtists), inline: false },
        { name: 'Top Listeners', value: formatListenerList(topListeners, client), inline: false },
        { name: 'Total Plays', value: `${totalListens}`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: resetStats ? 'Stats reset weekly' : 'Preview only - stats not reset' }
    };

    await channel.send({ embeds: [embed] });
    console.log(`Spotify weekly recap posted (reset: ${resetStats})`);

    if (resetStats) {
      await resetWeeklyStats(guildId);
      console.log('Spotify weekly stats reset');
    }
  } catch (error) {
    console.error('Error posting Spotify recap:', error);
  }
}
