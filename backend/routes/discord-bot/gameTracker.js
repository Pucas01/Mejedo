import { EmbedBuilder } from 'discord.js';
import * as gameStatsDb from './gameStatsDb.js';
import * as wordStatsDb from './wordStatsDb.js';

const activeSessions = new Map(); // userId -> { guildId, gameName, gameId, startTime }
const lastStreakCheck = new Map(); // userId -> { date, streaks: { gameName: streakCount } }
let recapInterval = null;
let streakCheckInterval = null;

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
        await handleGameStop(guildId, userId, client);
      }
      // User switched games
      else if (oldGame && newGame && oldGame.name !== newGame.name) {
        await handleGameStop(guildId, userId, client);
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

  // Check for streak updates daily at midnight
  startStreakChecking(client);

  console.log('Game tracking setup complete');
}

// Check streaks for a single user and send DM if needed
async function checkStreakForUser(client, userId) {
  try {
    // Check if user has streak DMs enabled
    const isEnabled = await gameStatsDb.isStreakDMsEnabled(userId);
    if (!isEnabled) return;

    const today = new Date().toISOString().split('T')[0];

    // Get current streaks
    const streaks = await gameStatsDb.getAllGameStreaks(userId);

    // Filter out 1-day streaks
    const notifiableStreaks = streaks.filter(s => s.streak > 1);

    if (notifiableStreaks.length === 0) {
      return;
    }

    // Check if any streaks have changed since last check
    const lastCheck = lastStreakCheck.get(userId);
    const previousStreaks = lastCheck?.streaks || {};

    const hasNewOrUpdated = notifiableStreaks.some(s =>
      !previousStreaks[s.game_name] || previousStreaks[s.game_name] !== s.streak
    );

    if (!hasNewOrUpdated) {
      return;
    }

    // Build streak map for tracking
    const currentStreaks = {};
    notifiableStreaks.forEach(s => {
      currentStreaks[s.game_name] = s.streak;
    });

    // Send DM
    try {
      const user = await client.users.fetch(userId);

      const streakText = notifiableStreaks
        .map(s => `🔥 **${s.streak}-day streak**: ${s.game_name}`)
        .join('\n');

      const embed = {
        title: 'Your Gaming Streaks Updated!',
        description: streakText,
        color: 0x39ff14,
        footer: {
          text: 'Hey, yeah you, listen up, 67.'
        },
        timestamp: new Date().toISOString()
      };

      await user.send({ embeds: [embed] });
      console.log(`[Streak DM] Sent streak update to user ${userId}`);
    } catch (dmError) {
      console.error(`[Streak DM] Could not send DM to user ${userId}:`, dmError.message);
    }

    // Update last check
    lastStreakCheck.set(userId, { date: today, streaks: currentStreaks });
  } catch (error) {
    console.error(`[Streak Check] Error checking streak for user ${userId}:`, error);
  }
}

// Check streaks and send DMs to opted-in users (scheduled hourly check)
async function checkStreaksAndNotify(client) {
  try {
    // Get all users who have streak DMs enabled
    const optedInUsers = await gameStatsDb.allAsync('SELECT user_id FROM streak_dm_optin');

    for (const { user_id } of optedInUsers) {
      await checkStreakForUser(client, user_id);
    }
  } catch (error) {
    console.error('[Streak Check] Error checking streaks:', error);
  }
}

// Start daily streak checking (runs at midnight and every hour to catch timezone differences)
function startStreakChecking(client) {
  // Check every hour
  streakCheckInterval = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Only run at the top of each hour
    if (minute < 5) {
      checkStreaksAndNotify(client);
    }
  }, 60 * 60 * 1000); // Every hour

  // Also run once on startup (but wait a bit for bot to fully initialize)
  setTimeout(() => {
    checkStreaksAndNotify(client);
  }, 30000); // Wait 30 seconds after startup

  console.log('Streak checking scheduler started');
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

async function handleGameStop(guildId, userId, client) {
  const session = activeSessions.get(userId);

  if (session) {
    // End session in database
    await gameStatsDb.endGameSession(guildId, userId, session.sessionId);

    // Remove from memory
    activeSessions.delete(userId);

    const duration = Math.floor((Date.now() - session.startTime) / 1000 / 60); // minutes
    console.log(`[Game Tracker] ${userId} stopped playing ${session.gameName} (${duration}m)`);

    // Check for new streaks immediately after stopping
    await checkStreakForUser(client, userId);
  }
}

async function updateActiveSessionCheckpoints() {
  // Update end times for all active sessions as checkpoints
  // This prevents data loss if bot crashes during long sessions
  // We just update the end_time of the existing session without creating new ones
  for (const [userId, session] of activeSessions.entries()) {
    try {
      // Just update the end_time, don't create a new session
      await gameStatsDb.endGameSession(session.guildId, userId, session.sessionId);
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
  if (streakCheckInterval) {
    clearInterval(streakCheckInterval);
    streakCheckInterval = null;
    console.log('Streak checking scheduler stopped');
  }
}
