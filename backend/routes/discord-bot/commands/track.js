import { SlashCommandBuilder } from 'discord.js';
import {
  setGlobalOptOut as setSpotifyOptOut,
  removeGlobalOptOut as removeSpotifyOptOut,
  isGloballyOptedOut as isSpotifyOptedOut,
} from '../spotifyStatsDb.js';
import * as gameStatsDb from '../gameStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('track')
    .setDescription('Manage your tracking preferences')
    .addSubcommand(subcommand =>
      subcommand
        .setName('optout')
        .setDescription('Opt out of tracking')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('What to opt out of')
            .setRequired(true)
            .addChoices(
              { name: 'Music (Spotify)', value: 'music' },
              { name: 'Gaming', value: 'gaming' },
              { name: 'Both', value: 'both' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('optin')
        .setDescription('Opt back into tracking')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('What to opt into')
            .setRequired(true)
            .addChoices(
              { name: 'Music (Spotify)', value: 'music' },
              { name: 'Gaming', value: 'gaming' },
              { name: 'Both', value: 'both' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check your current tracking status')
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
      if (subcommand === 'optout') {
        const type = interaction.options.getString('type');
        await interaction.deferReply({ ephemeral: true });

        let musicOptedOut = false;
        let gamingOptedOut = false;
        let messages = [];

        if (type === 'music' || type === 'both') {
          const alreadyOptedOut = await isSpotifyOptedOut(userId);
          if (alreadyOptedOut) {
            messages.push('You are already opted out of Spotify tracking.');
          } else {
            await setSpotifyOptOut(userId, username);
            musicOptedOut = true;
            messages.push('Opted out of Spotify tracking.');
          }
        }

        if (type === 'gaming' || type === 'both') {
          const alreadyOptedOut = await gameStatsDb.isUserOptedOut(userId);
          if (alreadyOptedOut) {
            messages.push('You are already opted out of gaming tracking.');
          } else {
            await gameStatsDb.optOutUser(userId);
            gamingOptedOut = true;
            messages.push('Opted out of gaming tracking.');
          }
        }

        const embed = {
          title: 'Opt-out Complete',
          description: messages.join('\n'),
          color: 0xff5555,
          fields: []
        };

        if (musicOptedOut || gamingOptedOut) {
          embed.fields.push({
            name: 'What this means:',
            value: `${musicOptedOut ? '- The bot will no longer track your Spotify activity\n' : ''}${gamingOptedOut ? '- The bot will no longer track your gaming sessions\n' : ''}- Your existing data has been preserved\n- You can opt back in anytime with \`/track optin\``,
            inline: false
          });
        }

        await interaction.editReply({ embeds: [embed] });
        console.log(`[Track] User ${username} opted out of ${type}`);
      }
      else if (subcommand === 'optin') {
        const type = interaction.options.getString('type');
        await interaction.deferReply({ ephemeral: true });

        let musicOptedIn = false;
        let gamingOptedIn = false;
        let messages = [];

        if (type === 'music' || type === 'both') {
          const wasOptedOut = await isSpotifyOptedOut(userId);
          if (!wasOptedOut) {
            messages.push('You are already opted into Spotify tracking.');
          } else {
            await removeSpotifyOptOut(userId);
            musicOptedIn = true;
            messages.push('Opted back into Spotify tracking.');
          }
        }

        if (type === 'gaming' || type === 'both') {
          const wasOptedOut = await gameStatsDb.isUserOptedOut(userId);
          if (!wasOptedOut) {
            messages.push('You are already opted into gaming tracking.');
          } else {
            await gameStatsDb.optInUser(userId);
            gamingOptedIn = true;
            messages.push('Opted back into gaming tracking.');
          }
        }

        const embed = {
          title: 'Opt-in Complete',
          description: messages.join('\n'),
          color: 0x39ff14,
          fields: []
        };

        if (musicOptedIn || gamingOptedIn) {
          embed.fields.push({
            name: 'What this means:',
            value: `${musicOptedIn ? '- The bot will now track your Spotify activity\n' : ''}${gamingOptedIn ? '- The bot will now track your gaming sessions\n' : ''}- Tracking only works in servers where the feature is enabled\n- You can opt out anytime with \`/track optout\``,
            inline: false
          });
        }

        await interaction.editReply({ embeds: [embed] });
        console.log(`[Track] User ${username} opted into ${type}`);
      }
      else if (subcommand === 'status') {
        const musicOptedOut = await isSpotifyOptedOut(userId);
        const gamingOptedOut = await gameStatsDb.isUserOptedOut(userId);

        const embed = {
          title: 'Your Tracking Status',
          color: (musicOptedOut && gamingOptedOut) ? 0xff5555 : (!musicOptedOut && !gamingOptedOut) ? 0x39ff14 : 0xffa500,
          fields: [
            {
              name: 'Music (Spotify)',
              value: musicOptedOut ? '**Opted Out** - Not being tracked' : '**Opted In** - Being tracked in enabled servers',
              inline: true
            },
            {
              name: 'Gaming',
              value: gamingOptedOut ? '**Opted Out** - Not being tracked' : '**Opted In** - Being tracked in enabled servers',
              inline: true
            }
          ],
          footer: {
            text: 'Use /track optout or /track optin to change your preferences'
          }
        };

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error('Error in track command:', error);
      await interaction.reply({
        content: 'An error occurred while updating your tracking preferences.',
        ephemeral: true
      });
    }
  },
};
