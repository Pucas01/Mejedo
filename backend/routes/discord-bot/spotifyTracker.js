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
let loopCheckInterval = null;

const MAX_PLAYING_AGE_MS = 30 * 60 * 1000;

const MIN_PLAY_TIME_MS = 10 * 1000;

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

function startLoopDetection(client) {
  loopCheckInterval = setInterval(async () => {
    const now = Date.now();

    for (const [userId, trackData] of currentlyPlaying.entries()) {
      if (!trackData.logged) continue;

      try {
        let foundPresence = null;
        for (const guild of client.guilds.cache.values()) {
          const member = guild.members.cache.get(userId);
          if (member?.presence) {
            foundPresence = member.presence;
            break;
          }
        }

        if (!foundPresence) continue;

        const spotifyActivity = foundPresence.activities.find(
          (activity) => activity.name === 'Spotify' && activity.type === 2
        );

        if (!spotifyActivity || spotifyActivity.syncId !== trackData.trackId) {
          continue;
        }

        const activityStart = spotifyActivity.timestamps?.start;
        if (!activityStart) continue;

        const currentPosition = now - activityStart;
        const lastPosition = trackData.lastKnownPosition || 0;

        const timeSinceLastLog = now - (trackData.lastLogTime || 0);
        if (currentPosition < lastPosition - 5000 && timeSinceLastLog >= 60000) {

          if (trackData.logTimeout) {
            clearTimeout(trackData.logTimeout);
          }

          const logTimeout = setTimeout(async () => {
            await logListenToAllGuilds(userId, trackData.trackName, trackData.artist, trackData.album, trackData.trackId, trackData.durationMs);
            const track = currentlyPlaying.get(userId);
            if (track) {
              track.lastLogTime = Date.now();
              track.logTimeout = null;
            }
            console.log(`[Spotify] User ${userId} listened to (looped): ${trackData.trackName} by ${trackData.artist}`);
          }, MIN_PLAY_TIME_MS);

          currentlyPlaying.set(userId, {
            ...trackData,
            lastKnownPosition: currentPosition,
            logTimeout,
          });
        } else {
          trackData.lastKnownPosition = currentPosition;
        }
      } catch (error) {
        console.error('[Loop Check] Error checking user:', error);
      }
    }
  }, 30000);

  console.log('Spotify loop detection polling started (every 30s)');
}

export function registerSpotifyTracking(client) {
  startLoopDetection(client);

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
        const currentTrack = currentlyPlaying.get(userId);
        if (currentTrack?.logTimeout) {
          clearTimeout(currentTrack.logTimeout);
        }
        currentlyPlaying.delete(userId);
        return;
      }

      const trackId = spotifyActivity.syncId;
      const trackName = spotifyActivity.details;
      const artist = spotifyActivity.state;
      const album = spotifyActivity.assets?.largeText;
      const durationMs = spotifyActivity.timestamps?.end
        ? spotifyActivity.timestamps.end - spotifyActivity.timestamps.start
        : null;
      const activityStartTime = spotifyActivity.timestamps?.start;

      const currentTrack = currentlyPlaying.get(userId);
      const now = Date.now();

      if (currentTrack && currentTrack.trackId === trackId) {
        if (currentTrack.activityStartTime && activityStartTime) {
          const timeDiff = Math.abs(activityStartTime - currentTrack.activityStartTime);

          if (timeDiff > 2000 && currentTrack.logged) {

            if (currentTrack.logTimeout) {
              clearTimeout(currentTrack.logTimeout);
            }

            const logTimeout = setTimeout(async () => {
              await logListenToAllGuilds(userId, trackName, artist, album, trackId, durationMs);
              const track = currentlyPlaying.get(userId);
              if (track) {
                track.lastLogTime = Date.now();
                track.logTimeout = null;
              }
              console.log(`[Spotify] ${newPresence.user?.username} listened to (looped): ${trackName} by ${artist}`);
            }, MIN_PLAY_TIME_MS);

            currentlyPlaying.set(userId, {
              ...currentTrack,
              activityStartTime,
              logTimeout,
            });
            return;
          }
        }

        if (currentTrack.logged) {
          const timeSinceLastLog = now - currentTrack.lastLogTime;

          if (timeSinceLastLog >= 60000) {

            if (currentTrack.logTimeout) {
              clearTimeout(currentTrack.logTimeout);
            }

            const logTimeout = setTimeout(async () => {
              await logListenToAllGuilds(userId, trackName, artist, album, trackId, durationMs);
              const track = currentlyPlaying.get(userId);
              if (track) {
                track.lastLogTime = Date.now();
                track.logTimeout = null;
              }
              console.log(`[Spotify] ${newPresence.user?.username} listened to (looped): ${trackName} by ${artist}`);
            }, MIN_PLAY_TIME_MS);

            currentlyPlaying.set(userId, {
              ...currentTrack,
              logTimeout,
            });
          }
        }
        return;
      }

      if (currentTrack?.logTimeout) {
        clearTimeout(currentTrack.logTimeout);
      }

      const startTime = now;

      const logTimeout = setTimeout(async () => {
        await logListenToAllGuilds(userId, trackName, artist, album, trackId, durationMs);

        const track = currentlyPlaying.get(userId);
        if (track) {
          track.logged = true;
          track.lastLogTime = Date.now();
          track.logTimeout = null;
        }

        console.log(`[Spotify] ${newPresence.user?.username} listened to: ${trackName} by ${artist}`);
      }, MIN_PLAY_TIME_MS);

      currentlyPlaying.set(userId, {
        trackId,
        startTime,
        trackName,
        artist,
        album,
        durationMs,
        logTimeout,
        logged: false,
        lastLogTime: null,
        activityStartTime,
        lastKnownPosition: 0,
      });
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
  if (loopCheckInterval) {
    clearInterval(loopCheckInterval);
    loopCheckInterval = null;
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
