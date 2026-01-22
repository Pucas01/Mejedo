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

// Track currently playing songs to avoid duplicate logs
const currentlyPlaying = new Map(); // userId -> { trackId, startTime, trackName, artist, logTimeout, logged }

let recapInterval = null;
let cleanupInterval = null;
let loopCheckInterval = null;

// Maximum age for currentlyPlaying entries (30 minutes)
const MAX_PLAYING_AGE_MS = 30 * 60 * 1000;

// Minimum play time before logging a song (10 seconds)
const MIN_PLAY_TIME_MS = 10 * 1000;

// Cleanup stale entries from currentlyPlaying Map
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

// Poll for song position changes to detect loops
function startLoopDetection(client) {
  // Check every 30 seconds for position changes
  loopCheckInterval = setInterval(async () => {
    const now = Date.now();

    for (const [userId, trackData] of currentlyPlaying.entries()) {
      // Skip if song hasn't been logged yet
      if (!trackData.logged) continue;

      try {
        // Find the user's current presence across all guilds
        let foundPresence = null;
        for (const guild of client.guilds.cache.values()) {
          const member = guild.members.cache.get(userId);
          if (member?.presence) {
            foundPresence = member.presence;
            break;
          }
        }

        if (!foundPresence) continue;

        // Find Spotify activity
        const spotifyActivity = foundPresence.activities.find(
          (activity) => activity.name === 'Spotify' && activity.type === 2
        );

        if (!spotifyActivity || spotifyActivity.syncId !== trackData.trackId) {
          // User stopped playing or switched songs
          continue;
        }

        // Calculate current position in the song
        const activityStart = spotifyActivity.timestamps?.start;
        if (!activityStart) continue;

        const currentPosition = now - activityStart;
        const lastPosition = trackData.lastKnownPosition || 0;

        // If position went backwards AND at least 1 minute has passed since last log, it's a loop
        const timeSinceLastLog = now - (trackData.lastLogTime || 0);
        if (currentPosition < lastPosition - 5000 && timeSinceLastLog >= 60000) {

          // Cancel any pending timeout
          if (trackData.logTimeout) {
            clearTimeout(trackData.logTimeout);
          }

          // Schedule a new log after 10 seconds
          const logTimeout = setTimeout(async () => {
            await logListenToAllGuilds(userId, trackData.trackName, trackData.artist, trackData.album, trackData.trackId, trackData.durationMs);
            const track = currentlyPlaying.get(userId);
            if (track) {
              track.lastLogTime = Date.now();
              track.logTimeout = null;
            }
            console.log(`[Spotify] User ${userId} listened to (looped): ${trackData.trackName} by ${trackData.artist}`);
          }, MIN_PLAY_TIME_MS);

          // Update tracker
          currentlyPlaying.set(userId, {
            ...trackData,
            lastKnownPosition: currentPosition,
            logTimeout,
          });
        } else {
          // Update the last known position
          trackData.lastKnownPosition = currentPosition;
        }
      } catch (error) {
        console.error('[Loop Check] Error checking user:', error);
      }
    }
  }, 30000); // Check every 30 seconds

  console.log('Spotify loop detection polling started (every 30s)');
}

// Register Spotify presence tracking
export function registerSpotifyTracking(client) {
  // Start loop detection polling
  startLoopDetection(client);

  client.on('presenceUpdate', async (oldPresence, newPresence) => {
    try {
      // Skip if user is not in a guild
      if (!newPresence.guild) return;

      const userId = newPresence.userId;
      const guildId = newPresence.guild.id;

      // Check if Spotify tracking is enabled for this guild
      const enabled = await isFeatureEnabled(guildId, 'spotify_tracking');
      if (!enabled) return;

      // Check if this user is tracked in ANY guild (global check to avoid duplicate tracking)
      const tracked = await isUserTrackedGlobally(userId);
      if (!tracked) return;

      // Find Spotify activity in the new presence
      const spotifyActivity = newPresence.activities.find(
        (activity) => activity.name === 'Spotify' && activity.type === 2 // Type 2 = Listening
      );

      // If no Spotify activity, clear currently playing for this user
      if (!spotifyActivity) {
        const currentTrack = currentlyPlaying.get(userId);
        // Cancel pending log timeout if song was skipped before 10 seconds
        if (currentTrack?.logTimeout) {
          clearTimeout(currentTrack.logTimeout);
        }
        currentlyPlaying.delete(userId);
        return;
      }

      // Extract track info from Spotify activity
      const trackId = spotifyActivity.syncId; // Spotify track ID
      const trackName = spotifyActivity.details; // Song name
      const artist = spotifyActivity.state; // Artist name
      const album = spotifyActivity.assets?.largeText; // Album name
      const durationMs = spotifyActivity.timestamps?.end
        ? spotifyActivity.timestamps.end - spotifyActivity.timestamps.start
        : null;
      const activityStartTime = spotifyActivity.timestamps?.start; // When Spotify says the song started

      // Check if this is a new song or continuation of same song
      const currentTrack = currentlyPlaying.get(userId);
      const now = Date.now();

      if (currentTrack && currentTrack.trackId === trackId) {
        // Same track still playing
        // Check for loop via activity start time change
        if (currentTrack.activityStartTime && activityStartTime) {
          const timeDiff = Math.abs(activityStartTime - currentTrack.activityStartTime);

          // If activity start time changed significantly (>2 seconds), this is a loop/restart
          if (timeDiff > 2000 && currentTrack.logged) {

            // Cancel old timeout if it exists
            if (currentTrack.logTimeout) {
              clearTimeout(currentTrack.logTimeout);
            }

            // Schedule a new log after 10 seconds
            const logTimeout = setTimeout(async () => {
              await logListenToAllGuilds(userId, trackName, artist, album, trackId, durationMs);
              const track = currentlyPlaying.get(userId);
              if (track) {
                track.lastLogTime = Date.now();
                track.logTimeout = null;
              }
              console.log(`[Spotify] ${newPresence.user?.username} listened to (looped): ${trackName} by ${artist}`);
            }, MIN_PLAY_TIME_MS);

            // Update tracker with new activity start time
            currentlyPlaying.set(userId, {
              ...currentTrack,
              activityStartTime,
              logTimeout,
            });
            return;
          }
        }

        // Fallback: check if we need to handle loops via time-based detection
        if (currentTrack.logged) {
          // Song was already logged, check if enough time has passed for a loop
          const timeSinceLastLog = now - currentTrack.lastLogTime;

          if (timeSinceLastLog >= 60000) { // 60000ms = 1 minute
            // More than 1 minute has passed, this is a loop/restart

            // Cancel old timeout if it exists
            if (currentTrack.logTimeout) {
              clearTimeout(currentTrack.logTimeout);
            }

            // Schedule a new log after 10 seconds
            const logTimeout = setTimeout(async () => {
              await logListenToAllGuilds(userId, trackName, artist, album, trackId, durationMs);
              const track = currentlyPlaying.get(userId);
              if (track) {
                track.lastLogTime = Date.now();
                track.logTimeout = null;
              }
              console.log(`[Spotify] ${newPresence.user?.username} listened to (looped): ${trackName} by ${artist}`);
            }, MIN_PLAY_TIME_MS);

            // Update tracker
            currentlyPlaying.set(userId, {
              ...currentTrack,
              logTimeout,
            });
          }
        }
        // Song still playing, don't do anything else
        return;
      }

      // New song detected! Clear previous timeout if exists
      if (currentTrack?.logTimeout) {
        clearTimeout(currentTrack.logTimeout);
      }

      // Start tracking this new song
      const startTime = now;

      // Schedule log after 10 seconds of continuous play
      const logTimeout = setTimeout(async () => {
        // Log to ALL guilds where this user is tracked
        await logListenToAllGuilds(userId, trackName, artist, album, trackId, durationMs);

        // Mark as logged
        const track = currentlyPlaying.get(userId);
        if (track) {
          track.logged = true;
          track.lastLogTime = Date.now();
          track.logTimeout = null;
        }

        console.log(`[Spotify] ${newPresence.user?.username} listened to: ${trackName} by ${artist}`);
      }, MIN_PLAY_TIME_MS);

      // Update currently playing tracker
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
        activityStartTime, // Track Spotify's reported start time
        lastKnownPosition: 0, // Track the song position for loop detection
      });
    } catch (error) {
      console.error('Error tracking Spotify presence:', error);
    }
  });

  console.log('Spotify tracking registered');
}

// Start weekly recap scheduler
export function startSpotifyRecap(client) {
  // Start cleanup interval for currentlyPlaying Map (every 10 minutes)
  cleanupInterval = setInterval(() => {
    cleanupStaleEntries();
  }, 10 * 60 * 1000);
  console.log('Spotify currentlyPlaying cleanup scheduler started');

  // Check every 5 minutes if it's time for any guild's recap
  recapInterval = setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Only check in the first 5 minutes of each hour
    if (currentMinute >= 5) return;

    // Get all guilds with recap channels configured
    const recapChannels = await getAllRecapChannels();

    for (const { guild_id, recap_channel_id, recap_day, recap_hour } of recapChannels) {
      // Check if Spotify tracking is enabled for this guild
      const enabled = await isFeatureEnabled(guild_id, 'spotify_tracking');
      if (!enabled) continue;

      // Check if it's time for this guild's recap
      if (currentDay === recap_day && currentHour === recap_hour) {
        await postSpotifyRecap(client, recap_channel_id, guild_id, true);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  console.log('Spotify recap scheduler started');
}

// Stop the recap scheduler
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

// Format track list for embed
function formatTrackList(tracks) {
  if (!tracks || tracks.length === 0) return 'No data yet';
  return tracks
    .map((t, i) => {
      const listeners = t.unique_listeners > 1 ? ` • ${t.unique_listeners} listeners` : '';
      return `${i + 1}. **${t.track_name}** - ${t.artist} (${t.play_count} plays${listeners})`;
    })
    .join('\n');
}

// Format artist list for embed
function formatArtistList(artists) {
  if (!artists || artists.length === 0) return 'No data yet';
  return artists
    .map((a, i) => {
      const listeners = a.unique_listeners > 1 ? ` • ${a.unique_listeners} listeners` : '';
      return `${i + 1}. **${a.artist}** (${a.play_count} plays${listeners})`;
    })
    .join('\n');
}

// Format listener list for embed
function formatListenerList(listeners, client) {
  if (!listeners || listeners.length === 0) return 'No data yet';
  return listeners
    .map((l, i) => {
      const tracksText = l.unique_tracks === 1 ? 'track' : 'tracks';
      return `${i + 1}. <@${l.user_id}> - ${l.listen_count} plays (${l.unique_tracks} unique ${tracksText})`;
    })
    .join('\n');
}

// Post weekly Spotify recap to channel
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

    // Skip if no data
    if (totalListens === 0) {
      console.log('No Spotify data for weekly recap, skipping');
      return;
    }

    const embed = {
      title: resetStats ? 'Weekly Music Recap' : 'Music Stats Preview',
      color: 0x39ff14, // Neon green (matches word recap)
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

    // Reset weekly stats only if requested
    if (resetStats) {
      await resetWeeklyStats(guildId);
      console.log('Spotify weekly stats reset');
    }
  } catch (error) {
    console.error('Error posting Spotify recap:', error);
  }
}
