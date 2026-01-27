import {
  incrementWordCount,
  getWeeklyTopWords,
  getWeeklyTopUsers,
  getWeeklyTotalCount,
  resetWeeklyStats,
  getAllRecapChannels,
  isFeatureEnabled
} from './wordStatsDb.js';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'out', 'whenever', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'where', 'when',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
  'once', 'if', 'my', 'your', 'his', 'her', 'our', 'their', 'me', 'him',
  'her', 'us', 'them', 'am', 'im', 'ive', 'id', 'ill', 'youre', 'youve',
  'dont', 'didnt', 'cant', 'wont', 'isnt', 'arent', 'wasnt', 'werent',
  'hasnt', 'havent', 'hadnt', 'doesnt', 'couldnt', 'shouldnt',
  'wouldnt', 'thats', 'whats', 'hes', 'shes', 'theyre',
  'theres', 'heres', 'get', 'got', 'like', 'yeah', 'yes', 'ok', 'okay',
  'um', 'uh', 'oh', 'ah', 'gonna', 'wanna', 'gotta', 'kinda',
  'really', 'actually', 'basically', 'literally', 'probably', 'maybe',
  'thing', 'things', 'stuff', 'way', 'something', 'anything', 'everything',
  'nothing', 'someone', 'anyone', 'everyone', 'one', 'two', 'much', 'many'
]);

let recapInterval = null;

export function registerWordTracking(client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const enabled = await isFeatureEnabled(message.guild.id, 'word_tracking');
    if (!enabled) return;

    const words = message.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1);

    for (const word of words) {
      try {
        await incrementWordCount(message.guild.id, message.author.id, word);
      } catch (error) {
        console.error('Error incrementing word count:', error);
      }
    }
  });

  console.log('Word tracking registered');
}

export { STOP_WORDS };

export function startWeeklyRecap(client) {
  recapInterval = setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentMinute >= 5) return;

    const recapChannels = await getAllRecapChannels();

    for (const { recap_channel_id, recap_day, recap_hour } of recapChannels) {
      if (currentDay === recap_day && currentHour === recap_hour) {
        await postWeeklyRecap(client, recap_channel_id);
      }
    }
  }, 5 * 60 * 1000);

  console.log('Weekly recap scheduler started');
}

export function stopWeeklyRecap() {
  if (recapInterval) {
    clearInterval(recapInterval);
    recapInterval = null;
  }
}

function formatWordList(words) {
  if (!words || words.length === 0) return 'No data yet';
  return words
    .map((w, i) => {
      let word = w.word;

      // Reconstruct Discord emoji format from stored pattern
      const emojiMatch = w.word.match(/^([a-z_]{2,})(\d{17,20})$/i);
      if (emojiMatch) {
        word = `<:${emojiMatch[1]}:${emojiMatch[2]}>`;
      } else if (/^\d{17,20}$/.test(w.word)) {
        word = `<@${w.word}>`;
      }

      return `${i + 1}. **${word}** - ${w.total_count || w.count}`;
    })
    .join('\n');
}

function formatUserList(users) {
  if (!users || users.length === 0) return 'No data yet';
  return users
    .map((u, i) => `${i + 1}. <@${u.user_id}> - ${u.total_words} words`)
    .join('\n');
}

export async function postWeeklyRecap(client, channelId, resetStats = true) {
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error('Recap channel not found:', channelId);
    return;
  }

  const guildId = channel.guild.id;

  try {
    const topWords = await getWeeklyTopWords(guildId, 10, STOP_WORDS);
    const topUsers = await getWeeklyTopUsers(guildId, 5);
    const totalWords = await getWeeklyTotalCount(guildId);

    if (totalWords === 0) {
      console.log('No word data for weekly recap, skipping');
      return;
    }

    const embed = {
      title: resetStats ? 'Weekly Word Recap' : 'Word Stats Preview',
      color: 0x39ff14,
      fields: [
        { name: 'Top Words This Week', value: formatWordList(topWords), inline: false },
        { name: 'Most Active Users', value: formatUserList(topUsers), inline: false },
        { name: 'Total Words Tracked', value: `${totalWords}`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: resetStats ? 'Stats reset weekly' : 'Preview only - stats not reset' }
    };

    await channel.send({ embeds: [embed] });
    console.log(`Weekly recap posted (reset: ${resetStats})`);

    if (resetStats) {
      await resetWeeklyStats(guildId);
      console.log('Weekly stats reset');
    }
  } catch (error) {
    console.error('Error posting weekly recap:', error);
  }
}
