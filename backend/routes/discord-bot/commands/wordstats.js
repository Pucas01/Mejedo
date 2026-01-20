import { SlashCommandBuilder } from 'discord.js';
import { getTopWords, getTopWordsForUser } from '../wordStatsDb.js';
import { STOP_WORDS } from '../wordTracker.js';

export default {
  data: new SlashCommandBuilder()
    .setName('wordstats')
    .setDescription('View word usage')
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
      option.setName('filter')
        .setDescription('Filter common words or show all')
        .setRequired(false)
        .addChoices(
          { name: 'Filtered (hide common words)', value: 'filtered' },
          { name: 'Unfiltered (show all)', value: 'unfiltered' }
        )),

  async execute(interaction) {
    const scope = interaction.options.getString('scope') || 'server';
    const targetUser = interaction.options.getUser('user');
    const filter = interaction.options.getString('filter') || 'filtered';
    const guildId = interaction.guild.id;

    // Use stop words filter unless unfiltered is selected
    const stopWords = filter === 'filtered' ? STOP_WORDS : null;

    await interaction.deferReply();

    try {
      let words;
      let title;
      let description;
      const filterLabel = filter === 'unfiltered' ? ' (unfiltered)' : '';

      if (targetUser) {
        // View specific user's stats
        words = await getTopWordsForUser(guildId, targetUser.id, 15, stopWords);
        title = `Word Stats for ${targetUser.username}${filterLabel}`;
        description = `Top 15 most used words by ${targetUser.username}`;
      } else if (scope === 'personal') {
        // View own stats
        words = await getTopWordsForUser(guildId, interaction.user.id, 15, stopWords);
        title = `Your Word Stats${filterLabel}`;
        description = 'Your top 15 most used words';
      } else {
        // Server-wide stats
        words = await getTopWords(guildId, 15, stopWords);
        title = `Server Word Stats${filterLabel}`;
        description = 'Top 15 most used words in this server';
      }

      if (!words || words.length === 0) {
        await interaction.editReply('No word data recorded yet. Start chatting to build up stats!');
        return;
      }

      const wordList = words
        .map((w, i) => {
          const count = w.total_count || w.count;
          const bar = '|'.repeat(Math.min(Math.ceil(count / 10), 20));

          // Format word for display (handle emojis and user mentions)
          let displayWord = w.word;
          const emojiMatch = w.word.match(/^([a-z_]{2,})(\d{17,20})$/i);
          if (emojiMatch) {
            displayWord = `<:${emojiMatch[1]}:${emojiMatch[2]}>`;
          } else if (/^\d{17,20}$/.test(w.word)) {
            displayWord = `<@${w.word}>`;
          }

          return `\`${String(i + 1).padStart(2, ' ')}.\` **${displayWord}** - ${count} ${bar}`;
        })
        .join('\n');

      const embed = {
        title: title,
        description: description,
        color: 0x39ff14,
        fields: [
          { name: 'Rankings', value: wordList }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: filter === 'unfiltered' ? 'All-time stats (unfiltered)' : 'All-time stats (common words hidden)' }
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching word stats:', error);
      await interaction.editReply('An error occurred while fetching word stats.');
    }
  },
};
