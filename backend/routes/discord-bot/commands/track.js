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
        .setDescription('Opt out of tracking or notifications')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('What to opt out of')
            .setRequired(true)
            .addChoices(
              { name: 'Music (Spotify)', value: 'music' },
              { name: 'Gaming', value: 'gaming' },
              { name: 'Streak DM Notifications', value: 'streakdms' },
              { name: 'Both Music & Gaming', value: 'both' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('optin')
        .setDescription('Opt back into tracking or notifications')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('What to opt into')
            .setRequired(true)
            .addChoices(
              { name: 'Music (Spotify)', value: 'music' },
              { name: 'Gaming', value: 'gaming' },
              { name: 'Streak DM Notifications', value: 'streakdms' },
              { name: 'Both Music & Gaming', value: 'both' }
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
        let streakDMsDisabled = false;
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

        if (type === 'streakdms') {
          const alreadyDisabled = !(await gameStatsDb.isStreakDMsEnabled(userId));
          if (alreadyDisabled) {
            messages.push('You are not receiving streak DM notifications.');
          } else {
            await gameStatsDb.optOutStreakDMs(userId);
            streakDMsDisabled = true;
            messages.push('Disabled streak DM notifications.');
          }
        }

        const embed = {
          title: 'Opt-out Complete',
          description: messages.join('\n'),
          color: 0xff5555,
          fields: []
        };

        if (musicOptedOut || gamingOptedOut || streakDMsDisabled) {
          const whatThisMeans = [];
          if (musicOptedOut) whatThisMeans.push('- The bot will no longer track your Spotify activity');
          if (gamingOptedOut) whatThisMeans.push('- The bot will no longer track your gaming sessions');
          if (streakDMsDisabled) whatThisMeans.push('- You will no longer receive streak DM notifications');
          if (musicOptedOut || gamingOptedOut) whatThisMeans.push('- Your existing data has been preserved');
          whatThisMeans.push('- You can opt back in anytime with `/track optin`');

          embed.fields.push({
            name: 'What this means:',
            value: whatThisMeans.join('\n'),
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
        let streakDMsEnabled = false;
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

        if (type === 'streakdms') {
          const alreadyEnabled = await gameStatsDb.isStreakDMsEnabled(userId);
          if (alreadyEnabled) {
            messages.push('You are already receiving streak DM notifications.');
          } else {
            await gameStatsDb.optInStreakDMs(userId);
            streakDMsEnabled = true;
            messages.push('Enabled streak DM notifications (2+ day streaks only).');
          }
        }

        const embed = {
          title: 'Opt-in Complete',
          description: messages.join('\n'),
          color: 0x39ff14,
          fields: []
        };

        if (musicOptedIn || gamingOptedIn || streakDMsEnabled) {
          const whatThisMeans = [];
          if (musicOptedIn) whatThisMeans.push('- The bot will now track your Spotify activity');
          if (gamingOptedIn) whatThisMeans.push('- The bot will now track your gaming sessions');
          if (streakDMsEnabled) {
            whatThisMeans.push('- You will receive DMs when your gaming streaks update');
            whatThisMeans.push('- Only 2+ day streaks trigger notifications');
          }
          if (musicOptedIn || gamingOptedIn) whatThisMeans.push('- Tracking only works in servers where the feature is enabled');
          whatThisMeans.push('- You can opt out anytime with `/track optout`');

          embed.fields.push({
            name: 'What this means:',
            value: whatThisMeans.join('\n'),
            inline: false
          });
        }

        await interaction.editReply({ embeds: [embed] });
        console.log(`[Track] User ${username} opted into ${type}`);
      }
      else if (subcommand === 'status') {
        const musicOptedOut = await isSpotifyOptedOut(userId);
        const gamingOptedOut = await gameStatsDb.isUserOptedOut(userId);
        const streakDMsEnabled = await gameStatsDb.isStreakDMsEnabled(userId);

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
            },
            {
              name: 'Streak DM Notifications',
              value: streakDMsEnabled ? '**Enabled** - You will receive DMs when your gaming streaks update' : '**Disabled** - No streak notifications',
              inline: false
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
