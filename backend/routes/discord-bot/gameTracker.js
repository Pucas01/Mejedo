import { EmbedBuilder } from 'discord.js';
import * as gameStatsDb from './gameStatsDb.js';
import * as wordStatsDb from './wordStatsDb.js';

const activeSessions = new Map(); // userId -> { guildId, gameName, gameId, startTime }
let recapInterval = null;

export function setupGameTracking(client) {
  console.log('[Game Tracker] Setting up game tracking...');
  console.log('[Game Tracker] IMPORTANT: Presence Intent must be enabled in Discord Developer Portal');
  console.log('[Game Tracker] https://discord.com/developers/applications -> Your Bot -> Bot -> Privileged Gateway Intents -> Presence Intent (ON)');

  // Track presence changes
  client.on('presenceUpdate', async (oldPresence, newPresence) => {
    try {
      if (!newPresence || !newPresence.guild) return;

      const guildId = newPresence.guild.id;
      const userId = newPresence.userId;

      // Check if user is a bot
      if (newPresence.user?.bot) return;

      // Check if game tracking is enabled for this guild
      const settings = await wordStatsDb.getGuildSettings(guildId);
      if (!settings?.game_tracking_enabled) return;

      // Check if user has opted out
      const isOptedOut = await gameStatsDb.isUserOptedOut(userId);
      if (isOptedOut) return;

      // Get game activities (type 0 = Playing)
      const oldGame = oldPresence?.activities?.find(a => a.type === 0);
      const newGame = newPresence?.activities?.find(a => a.type === 0);

      // User started playing a game
      if (!oldGame && newGame) {
        await handleGameStart(guildId, userId, newGame);
      }
      // User stopped playing a game
      else if (oldGame && !newGame) {
        await handleGameStop(guildId, userId);
      }
      // User switched games
      else if (oldGame && newGame && oldGame.name !== newGame.name) {
        await handleGameStop(guildId, userId);
        await handleGameStart(guildId, userId, newGame);
      }
    } catch (error) {
      console.error('Error in presenceUpdate handler:', error);
    }
  });

  // Periodic checkpoint updates (every 5 minutes)
  setInterval(() => {
    updateActiveSessionCheckpoints();
  }, 5 * 60 * 1000);

  console.log('Game tracking setup complete');
}

async function handleGameStart(guildId, userId, game) {
  const gameName = game.name;
  const gameId = game.applicationId || null;

  // Store in database
  const sessionId = await gameStatsDb.startGameSession(guildId, userId, gameName, gameId);

  // Track in memory
  activeSessions.set(userId, {
    sessionId,
    guildId,
    gameName,
    gameId,
    startTime: Date.now(),
  });

  console.log(`[Game Tracker] ${userId} started playing ${gameName} in guild ${guildId}`);
}

async function handleGameStop(guildId, userId) {
  const session = activeSessions.get(userId);

  if (session) {
    // End session in database
    await gameStatsDb.endGameSession(guildId, userId, session.sessionId);

    // Remove from memory
    activeSessions.delete(userId);

    const duration = Math.floor((Date.now() - session.startTime) / 1000 / 60); // minutes
    console.log(`[Game Tracker] ${userId} stopped playing ${session.gameName} (${duration}m)`);
  }
}

async function updateActiveSessionCheckpoints() {
  // Update end times for all active sessions as checkpoints
  // This prevents data loss if bot crashes during long sessions
  for (const [userId, session] of activeSessions.entries()) {
    try {
      await gameStatsDb.endGameSession(session.guildId, userId, session.sessionId);
      // Restart the session with a new entry
      const newSessionId = await gameStatsDb.startGameSession(
        session.guildId,
        userId,
        session.gameName,
        session.gameId
      );
      session.sessionId = newSessionId;
    } catch (error) {
      console.error(`Error updating checkpoint for user ${userId}:`, error);
    }
  }

  if (activeSessions.size > 0) {
    console.log(`[Game Tracker] Updated ${activeSessions.size} active session checkpoints`);
  }
}

// Weekly recap
export async function postGameRecap(client, guildId, resetStats = true) {
  try {
    const settings = await wordStatsDb.getGuildSettings(guildId);
    if (!settings?.recap_channel_id) {
      console.log(`No recap channel configured for guild ${guildId}`);
      return;
    }

    // Get weekly stats
    const topGames = await gameStatsDb.getTopGames(guildId, 5, true);
    const topGamers = await gameStatsDb.getTopGamers(guildId, 5, true);
    const guildStats = await gameStatsDb.getGuildStats(guildId, true);

    // Check if there's any data
    if (!guildStats || guildStats.total_sessions === 0) {
      console.log(`No gaming activity this week in guild ${guildId}`);
      return;
    }

    const totalHours = (guildStats.total_seconds / 3600).toFixed(1);
    const avgHoursPerPlayer = (guildStats.total_seconds / 3600 / guildStats.unique_players).toFixed(1);

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(resetStats ? 'Weekly Gaming Recap' : 'Gaming Stats Preview')
      .setColor(0x39ff14)
      .setTimestamp();

    // Top games section
    if (topGames.length > 0) {
      const gamesText = topGames
        .map((game, i) => {
          const hours = (game.total_seconds / 3600).toFixed(1);
          const prefix = i === 0 ? '' : `${i + 1}. `;
          return `${prefix}${game.game_name} - ${hours} hours`;
        })
        .join('\n');
      embed.addFields({ name: 'Most Played Games', value: gamesText, inline: false });
    }

    // Top gamers section
    if (topGamers.length > 0) {
      const gamersText = topGamers
        .map((gamer, i) => {
          const hours = (gamer.total_seconds / 3600).toFixed(1);
          const prefix = i === 0 ? '' : `${i + 1}. `;
          return `${prefix}<@${gamer.user_id}> - ${hours} hours`;
        })
        .join('\n');
      embed.addFields({ name: 'Top Gamers', value: gamersText, inline: false });
    }

    // Summary stats
    embed.addFields({
      name: 'Summary',
      value: `Total Gaming This Week: ${totalHours} hours\nAverage per Active Gamer: ${avgHoursPerPlayer} hours`,
      inline: false,
    });

    // Send to recap channel
    const channel = await client.channels.fetch(settings.recap_channel_id);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log(`[Game Recap] Posted ${resetStats ? 'weekly recap' : 'preview'} to guild ${guildId}`);

      // Clear weekly stats only if requested
      if (resetStats) {
        await gameStatsDb.clearWeeklyStats(guildId);
        console.log(`[Game Recap] Cleared weekly stats for guild ${guildId}`);
      }
    }
  } catch (error) {
    console.error(`Error posting game recap for guild ${guildId}:`, error);
  }
}

// Stop tracking (for graceful shutdown)
export function stopGameTracking() {
  console.log('Stopping game tracking...');

  // End all active sessions
  for (const [userId, session] of activeSessions.entries()) {
    try {
      gameStatsDb.endGameSession(session.guildId, userId, session.sessionId);
    } catch (error) {
      console.error(`Error ending session for user ${userId}:`, error);
    }
  }

  activeSessions.clear();
  console.log('Game tracking stopped');
}

// Initialize on bot start - end any sessions that were active when bot stopped
export async function initializeGameTracking() {
  console.log('Initializing game tracking...');
  await gameStatsDb.endAllActiveSessions();
  console.log('Ended all previously active game sessions');
}

// Start weekly recap scheduler
export function startGameRecap(client) {
  // Check every 5 minutes if it's time for any guild's recap
  recapInterval = setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Only check in the first 5 minutes of each hour
    if (currentMinute >= 5) return;

    // Get all guilds with recap channels configured
    const recapChannels = await wordStatsDb.getAllRecapChannels();

    for (const { guild_id, recap_channel_id, recap_day, recap_hour } of recapChannels) {
      // Check if game tracking is enabled for this guild
      const settings = wordStatsDb.getGuildSettings(guild_id);
      if (!settings?.game_tracking_enabled) continue;

      // Check if it's time for this guild's recap
      if (currentDay === recap_day && currentHour === recap_hour) {
        await postGameRecap(client, guild_id);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  console.log('Game recap scheduler started');
}

// Stop the recap scheduler
export function stopGameRecap() {
  if (recapInterval) {
    clearInterval(recapInterval);
    recapInterval = null;
    console.log('Game recap scheduler stopped');
  }
}
