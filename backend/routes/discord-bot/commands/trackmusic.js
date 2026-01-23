import { SlashCommandBuilder } from 'discord.js';
import {
  setGlobalOptOut,
  removeGlobalOptOut,
  isGloballyOptedOut,
} from '../spotifyStatsDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('trackmusic')
    .setDescription('Manage your Spotify tracking preferences')
    .addSubcommand(subcommand =>
      subcommand
        .setName('optout')
        .setDescription('Opt out of Spotify tracking across all servers')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('optin')
        .setDescription('Opt back into Spotify tracking (removes opt-out)')
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
    const user = interaction.user;

    if (subcommand === 'optout') {
      await interaction.deferReply({ ephemeral: true });

      // Check if already opted out
      const alreadyOptedOut = await isGloballyOptedOut(user.id);
      if (alreadyOptedOut) {
        await interaction.editReply('You are already opted out of Spotify tracking.');
        return;
      }

      // Set opt-out flag
      await setGlobalOptOut(user.id, user.username);

      const message = `✅ **Opt-out complete!**

You have been opted out of Spotify tracking across all servers.

**What this means:**
• The bot will no longer track what you listen to on Spotify
• Your existing listening history remains in the database
• To completely delete your data, contact a server administrator

**Want to opt back in?**
Use \`/trackmusic optin\` to resume tracking.`;

      await interaction.editReply(message);
      console.log(`[Spotify] User ${user.username} opted out of tracking`);
    }
    else if (subcommand === 'optin') {
      await interaction.deferReply({ ephemeral: true });

      // Check if currently opted out
      const optedOut = await isGloballyOptedOut(user.id);
      if (!optedOut) {
        await interaction.editReply('You are already opted into Spotify tracking (not opted out).');
        return;
      }

      // Remove opt-out flag
      await removeGlobalOptOut(user.id);

      const message = `✅ **Opt-in complete!**

You have been opted back into Spotify tracking!

**What this means:**
• The bot will now track what you listen to on Spotify
• Tracking only works in servers where Spotify tracking is enabled
• Make sure you have Spotify connected to Discord for tracking to work

**Want to opt out again?**
Use \`/trackmusic optout\` to stop tracking.`;

      await interaction.editReply(message);
      console.log(`[Spotify] User ${user.username} opted back in to tracking`);
    }
    else if (subcommand === 'status') {
      const optedOut = await isGloballyOptedOut(user.id);

      const embed = {
        title: 'Your Spotify Tracking Status',
        color: optedOut ? 0xff5555 : 0x1db954,
        fields: [
          {
            name: 'Status',
            value: optedOut ? '**Opted Out** ❌' : '**Opted In** ✅',
            inline: true
          },
          {
            name: 'What this means',
            value: optedOut
              ? 'You are **not being tracked**. The bot will not log your Spotify activity.'
              : 'You are **being tracked** in servers where Spotify tracking is enabled.',
            inline: false
          }
        ],
        footer: {
          text: optedOut
            ? 'Use /trackmusic optin to opt back in'
            : 'Use /trackmusic optout to opt out'
        }
      };

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
