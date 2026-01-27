import { EmbedBuilder } from 'discord.js';
import * as gameStatsDb from './gameStatsDb.js';
import * as wordStatsDb from './wordStatsDb.js';

const activeSessions = new Map();
const lastStreakCheck = new Map();
let recapInterval = null;
let streakCheckInterval = null;

export function setupGameTracking(client) {
  console.log('[Game Tracker] Setting up game tracking...');
  console.log('[Game Tracker] IMPORTANT: Presence Intent must be enabled in Discord Developer Portal');
  console.log('[Game Tracker] https://discord.com/developers/applications -> Your Bot -> Bot -> Privileged Gateway Intents -> Presence Intent (ON)');

  client.on('presenceUpdate', async (oldPresence, newPresence) => {
    try {
      if (!newPresence || !newPresence.guild) return;

      const guildId = newPresence.guild.id;
      const userId = newPresence.userId;

      if (newPresence.user?.bot) return;

      const settings = await wordStatsDb.getGuildSettings(guildId);
      if (!settings?.game_tracking_enabled) return;

      const isOptedOut = await gameStatsDb.isUserOptedOut(userId);
      if (isOptedOut) return;

      const oldGame = oldPresence?.activities?.find(a => a.type === 0);
      const newGame = newPresence?.activities?.find(a => a.type === 0);

      if (!oldGame && newGame) {
        await handleGameStart(guildId, userId, newGame);
      } else if (oldGame && !newGame) {
        await handleGameStop(guildId, userId);
      } else if (oldGame && newGame && oldGame.name !== newGame.name) {
        await handleGameStop(guildId, userId);
        await handleGameStart(guildId, userId, newGame);
      }
    } catch (error) {
      console.error('Error in presenceUpdate handler:', error);
    }
  });

  setInterval(() => {
    updateActiveSessionCheckpoints();
  }, 5 * 60 * 1000);

  startStreakChecking(client);

  console.log('Game tracking setup complete');
}

async function checkStreaksAndNotify(client) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const optedInUsers = await gameStatsDb.allAsync('SELECT user_id FROM streak_dm_optin');

    for (const { user_id } of optedInUsers) {
      try {
        const lastCheck = lastStreakCheck.get(user_id);
        if (lastCheck && lastCheck.date === today) {
          continue;
        }

        const streaks = await gameStatsDb.getAllGameStreaks(user_id);
        const notifiableStreaks = streaks.filter(s => s.streak > 1);

        if (notifiableStreaks.length === 0) {
          lastStreakCheck.set(user_id, { date: today, streaks: {} });
          continue;
        }

        const previousStreaks = lastCheck?.streaks || {};
        const hasNewOrUpdated = notifiableStreaks.some(s =>
          !previousStreaks[s.game_name] || previousStreaks[s.game_name] !== s.streak
        );

        if (!hasNewOrUpdated) {
          continue;
        }

        const currentStreaks = {};
        notifiableStreaks.forEach(s => {
          currentStreaks[s.game_name] = s.streak;
        });

        try {
          const user = await client.users.fetch(user_id);

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
          console.log(`[Streak DM] Sent streak update to user ${user_id}`);
        } catch (dmError) {
          console.error(`[Streak DM] Could not send DM to user ${user_id}:`, dmError.message);
        }

        lastStreakCheck.set(user_id, { date: today, streaks: currentStreaks });
      } catch (userError) {
        console.error(`[Streak Check] Error processing user ${user_id}:`, userError);
      }
    }
  } catch (error) {
    console.error('[Streak Check] Error checking streaks:', error);
  }
}

function startStreakChecking(client) {
  streakCheckInterval = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (minute < 5) {
      checkStreaksAndNotify(client);
    }
  }, 60 * 60 * 1000);

  setTimeout(() => {
    checkStreaksAndNotify(client);
  }, 30000);

  console.log('Streak checking scheduler started');
}

async function handleGameStart(guildId, userId, game) {
  const gameName = game.name;
  const gameId = game.applicationId || null;

  const sessionId = await gameStatsDb.startGameSession(guildId, userId, gameName, gameId);

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
    await gameStatsDb.endGameSession(guildId, userId, session.sessionId);
    activeSessions.delete(userId);

    const duration = Math.floor((Date.now() - session.startTime) / 1000 / 60);
    console.log(`[Game Tracker] ${userId} stopped playing ${session.gameName} (${duration}m)`);
  }
}

async function updateActiveSessionCheckpoints() {
  // Prevents data loss if bot crashes during long sessions
  for (const [userId, session] of activeSessions.entries()) {
    try {
      await gameStatsDb.endGameSession(session.guildId, userId, session.sessionId);
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

export async function postGameRecap(client, guildId, resetStats = true) {
  try {
    const settings = await wordStatsDb.getGuildSettings(guildId);
    if (!settings?.recap_channel_id) {
      console.log(`No recap channel configured for guild ${guildId}`);
      return;
    }

    const topGames = await gameStatsDb.getTopGames(guildId, 5, true);
    const topGamers = await gameStatsDb.getTopGamers(guildId, 5, true);
    const guildStats = await gameStatsDb.getGuildStats(guildId, true);

    if (!guildStats || guildStats.total_sessions === 0) {
      console.log(`No gaming activity this week in guild ${guildId}`);
      return;
    }

    const totalHours = (guildStats.total_seconds / 3600).toFixed(1);
    const avgHoursPerPlayer = (guildStats.total_seconds / 3600 / guildStats.unique_players).toFixed(1);

    const embed = new EmbedBuilder()
      .setTitle(resetStats ? 'Weekly Gaming Recap' : 'Gaming Stats Preview')
      .setColor(0x39ff14)
      .setTimestamp();

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

    embed.addFields({
      name: 'Summary',
      value: `Total Gaming This Week: ${totalHours} hours\nAverage per Active Gamer: ${avgHoursPerPlayer} hours`,
      inline: false,
    });

    const channel = await client.channels.fetch(settings.recap_channel_id);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log(`[Game Recap] Posted ${resetStats ? 'weekly recap' : 'preview'} to guild ${guildId}`);

      if (resetStats) {
        await gameStatsDb.clearWeeklyStats(guildId);
        console.log(`[Game Recap] Cleared weekly stats for guild ${guildId}`);
      }
    }
  } catch (error) {
    console.error(`Error posting game recap for guild ${guildId}:`, error);
  }
}

export function stopGameTracking() {
  console.log('Stopping game tracking...');

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

export async function initializeGameTracking() {
  console.log('Initializing game tracking...');
  await gameStatsDb.endAllActiveSessions();
  console.log('Ended all previously active game sessions');
}

export function startGameRecap(client) {
  recapInterval = setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentMinute >= 5) return;

    const recapChannels = await wordStatsDb.getAllRecapChannels();

    for (const { guild_id, recap_channel_id, recap_day, recap_hour } of recapChannels) {
      const settings = wordStatsDb.getGuildSettings(guild_id);
      if (!settings?.game_tracking_enabled) continue;

      if (currentDay === recap_day && currentHour === recap_hour) {
        await postGameRecap(client, guild_id);
      }
    }
  }, 5 * 60 * 1000);

  console.log('Game recap scheduler started');
}

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
