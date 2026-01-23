import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as gameStatsDb from '../gameStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('gamestats')
    .setDescription('View gaming statistics')
    .addStringOption(option =>
      option
        .setName('scope')
        .setDescription('View server or personal stats')
        .addChoices(
          { name: 'Server', value: 'server' },
          { name: 'Personal', value: 'personal' }
        )
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('View stats for a specific user')
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('What to display')
        .addChoices(
          { name: 'Games & Gamers', value: 'both' },
          { name: 'Games Only', value: 'games' },
          { name: 'Gamers Only', value: 'gamers' }
        )
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    const context = interaction.context;
    const inDM = context === 1 || context === 2;
    const scope = interaction.options.getString('scope') || (inDM ? 'personal' : 'server');
    const targetUser = interaction.options.getUser('user');
    const type = interaction.options.getString('type') || 'both';
    const guildId = interaction.guild?.id;
    const userId = targetUser ? targetUser.id : interaction.user.id;

    await interaction.deferReply();

    if (inDM && scope === 'server') {
      await interaction.editReply({
        content: 'Server stats are not available in DMs. Use `/gamestats scope:Personal` to view your personal stats.',
      });
      return;
    }

    try {
      let embed = new EmbedBuilder()
        .setColor(0x39ff14)
        .setTimestamp();

      if (scope === 'personal' || targetUser) {
        const userStats = await gameStatsDb.getGlobalUserStats(userId);
        const topGames = await gameStatsDb.getGlobalTopGamesForUser(userId, 10);

        if (!userStats || userStats.total_sessions === 0) {
          await interaction.editReply({
            content: `${targetUser ? targetUser.username : 'You'} have no gaming data recorded yet.`,
          });
          return;
        }

        const totalHours = (userStats.total_seconds / 3600).toFixed(1);
        const avgSessionMinutes = (userStats.avg_session_seconds / 60).toFixed(0);

        embed.setTitle(`${targetUser ? targetUser.username : 'Your'} Gaming Stats (All-Time)`);

        embed.addFields({
          name: 'Summary',
          value: `Total Gaming: ${totalHours} hours\nUnique Games: ${userStats.unique_games}\nTotal Sessions: ${userStats.total_sessions}\nAvg Session: ${avgSessionMinutes} minutes`,
          inline: false,
        });

        if (topGames.length > 0) {
          const gamesText = topGames
            .slice(0, 10)
            .map((game, i) => {
              const hours = (game.total_seconds / 3600).toFixed(1);
              return `${i + 1}. ${game.game_name} - ${hours}h (${game.session_count} sessions)`;
            })
            .join('\n');
          embed.addFields({ name: 'Top Games', value: gamesText, inline: false });
        }
      } else {
        const guildStats = await gameStatsDb.getGuildStats(guildId, false);

        if (!guildStats || guildStats.total_sessions === 0) {
          await interaction.editReply({
            content: 'No gaming data recorded for this server yet.',
          });
          return;
        }

        const totalHours = (guildStats.total_seconds / 3600).toFixed(1);
        const avgHoursPerPlayer = (guildStats.total_seconds / 3600 / guildStats.unique_players).toFixed(1);

        embed.setTitle('Server Gaming Stats (All-Time)');

        if (type === 'both' || type === 'games') {
          const topGames = await gameStatsDb.getTopGames(guildId, 10, false);
          if (topGames.length > 0) {
            const gamesText = topGames
              .map((game, i) => {
                const hours = (game.total_seconds / 3600).toFixed(1);
                return `${i + 1}. ${game.game_name} - ${hours}h (${game.unique_players} players)`;
              })
              .join('\n');
            embed.addFields({ name: 'Top Games', value: gamesText, inline: false });
          }
        }

        if (type === 'both' || type === 'gamers') {
          const topGamers = await gameStatsDb.getTopGamers(guildId, 10, false);
          if (topGamers.length > 0) {
            const gamersText = topGamers
              .map((gamer, i) => {
                const hours = (gamer.total_seconds / 3600).toFixed(1);
                return `${i + 1}. <@${gamer.user_id}> - ${hours}h (${gamer.unique_games} games)`;
              })
              .join('\n');
            embed.addFields({ name: 'Top Gamers', value: gamersText, inline: false });
          }
        }

        embed.addFields({
          name: 'Summary',
          value: `Total Gaming: ${totalHours} hours\nActive Gamers: ${guildStats.unique_players}\nUnique Games: ${guildStats.unique_games}\nAvg per Gamer: ${avgHoursPerPlayer} hours`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in gamestats command:', error);
      await interaction.editReply({
        content: 'An error occurred while fetching gaming statistics.',
      });
    }
  },
};
