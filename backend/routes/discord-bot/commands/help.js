import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all bot commands and features')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Command category to view')
        .setRequired(false)
        .addChoices(
          { name: 'Statistics Commands', value: 'stats' },
          { name: 'Privacy & Data Commands', value: 'privacy' },
          { name: 'Admin Commands', value: 'admin' },
          { name: 'Utility Commands', value: 'utility' },
          { name: 'Silly Commands', value: 'silly' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category');

    if (!category) {
      // Main help overview
      const embed = new EmbedBuilder()
        .setColor('#39ff14')
        .setTitle('PucasBot - Command Reference')
        .setDescription(
          'Activity tracking bot for gaming, music, and chat statistics.\n\n' +
          'All features are disabled by default. ' +
          'Server admins must enable features with `/features toggle`.'
        )
        .addFields(
          {
            name: 'Statistics Commands',
            value: '`/help category:Statistics Commands`\nView word, gaming, and music statistics.',
            inline: false
          },
          {
            name: 'Privacy & Data Commands',
            value: '`/help category:Privacy & Data Commands`\nControl tracking settings and manage your data.',
            inline: false
          },
          {
            name: 'Admin Commands',
            value: '`/help category:Admin Commands`\nServer management and feature configuration.',
            inline: false
          },
          {
            name: 'Utility Commands',
            value: '`/help category:Utility Commands`\nHelpful tools and information.',
            inline: false
          },
          {
            name: 'Silly Commands',
            value: '`/help category:Silly Commands`\nEntertainment and social features.',
            inline: false
          },
          {
            name: '\u200b',
            value: '**Quick Start**\n' +
              '1. Admins: Enable features with `/features toggle`\n' +
              '2. Configure recap channel with `/setrecap`\n' +
              '3. View stats with `/wordstats`, `/gamestats`, or `/spotifystats`\n' +
              '4. Users can opt out anytime with `/track optout`'
          }
        )
        .setFooter({
          text: 'Select a category to view detailed command information',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // Category-specific help pages
    const embeds = {
      stats: new EmbedBuilder()
        .setColor('#39ff14')
        .setTitle('Statistics Commands')
        .setDescription('View server and personal activity statistics.')
        .addFields(
          {
            name: '/wordstats',
            value:
              '**Description:** View word usage statistics\n' +
              '**Options:**\n' +
              '• `scope` - Server or Personal stats\n' +
              '• `user` - View stats for a specific user\n' +
              '• `filter` - Filtered (hide common words) or Unfiltered\n' +
              '**Example:** `/wordstats scope:Personal filter:Filtered`\n' +
              '**Requirement:** Word Tracking must be enabled',
            inline: false
          },
          {
            name: '/gamestats',
            value:
              '**Description:** View gaming activity and streaks\n' +
              '**Options:**\n' +
              '• `scope` - Server or Personal stats\n' +
              '• `user` - View stats for a specific user\n' +
              '• `type` - Games & Gamers, Games Only, or Gamers Only\n' +
              '**Example:** `/gamestats scope:Server type:Games Only`\n' +
              '**Requirement:** Game Tracking must be enabled',
            inline: false
          },
          {
            name: '/spotifystats',
            value:
              '**Description:** View Spotify listening statistics\n' +
              '**Options:**\n' +
              '• `scope` - Server or Personal stats\n' +
              '• `user` - View stats for a specific user\n' +
              '• `type` - Tracks & Artists, Tracks Only, or Artists Only\n' +
              '**Example:** `/spotifystats scope:Personal type:Tracks Only`\n' +
              '**Requirement:** Spotify Tracking must be enabled',
            inline: false
          }
        )
        .setFooter({ text: 'Stats are tracked automatically from your Discord presence' }),

      privacy: new EmbedBuilder()
        .setColor('#39ff14')
        .setTitle('Privacy & Data Commands')
        .setDescription('Manage your privacy settings and control what data is tracked.')
        .addFields(
          {
            name: '/track status',
            value:
              '**Description:** Check your current tracking settings\n' +
              '**Options:** None\n' +
              '**Shows:** Music tracking, Gaming tracking, and Streak DM status',
            inline: false
          },
          {
            name: '/track optout',
            value:
              '**Description:** Opt out of specific tracking features\n' +
              '**Options:**\n' +
              '• `type` - Music, Gaming, Streak DMs, or Both (Music & Gaming)\n' +
              '**Example:** `/track optout type:Music`\n' +
              '**Note:** Opt-out is global across all servers',
            inline: false
          },
          {
            name: '/track optin',
            value:
              '**Description:** Opt back into tracking\n' +
              '**Options:**\n' +
              '• `type` - Music, Gaming, Streak DMs, or Both (Music & Gaming)\n' +
              '**Example:** `/track optin type:Gaming`\n' +
              '**Note:** Removes your opt-out preference',
            inline: false
          },
          {
            name: '/deletedata',
            value:
              '**Description:** Permanently delete all your data (GDPR compliance)\n' +
              '**Options:** None\n' +
              '**Warning:** This action is irreversible. Deletes all data across all servers.\n' +
              '**Requires:** Typing "CONFIRM DELETE" within 60 seconds',
            inline: false
          }
        )
        .setFooter({ text: 'Your privacy matters. All tracking can be disabled anytime.' }),

      admin: new EmbedBuilder()
        .setColor('#39ff14')
        .setTitle('Admin Commands')
        .setDescription('Server management commands. Requires Administrator permission.')
        .addFields(
          {
            name: '/features status',
            value:
              '**Description:** View enabled features for this server\n' +
              '**Options:** None\n' +
              '**Shows:** Word Tracking, Spotify Tracking, Game Tracking, Announcements',
            inline: false
          },
          {
            name: '/features toggle',
            value:
              '**Description:** Enable or disable bot features\n' +
              '**Options:**\n' +
              '• `feature` - Word Tracking, Spotify Tracking, Game Tracking, or Announcements\n' +
              '• `enabled` - True to enable, False to disable\n' +
              '**Example:** `/features toggle feature:Word Tracking enabled:True`\n' +
              '**Note:** All features are disabled by default on new servers',
            inline: false
          },
          {
            name: '/setrecap',
            value:
              '**Description:** Configure weekly recap channel and schedule\n' +
              '**Options:**\n' +
              '• `channel` - Channel to post recaps\n' +
              '• `day` - Day of week (Sunday to Saturday)\n' +
              '• `hour` - Hour in 24h format (0-23)\n' +
              '**Example:** `/setrecap channel:#stats day:Sunday hour:12`',
            inline: false
          },
          {
            name: '/setannouncements',
            value:
              '**Description:** Set announcement channel for this server\n' +
              '**Options:**\n' +
              '• `channel` - Channel for bot announcements\n' +
              '**Example:** `/setannouncements channel:#announcements`\n' +
              '**Note:** Announcements feature must be enabled',
            inline: false
          },
          {
            name: '/forcerecap',
            value:
              '**Description:** Manually post a weekly recap\n' +
              '**Options:**\n' +
              '• `type` - words, music, gaming, or all\n' +
              '**Example:** `/forcerecap type:all`\n' +
              '**Note:** Useful for testing or preview',
            inline: false
          }
        )
        .setFooter({ text: 'Admin commands are only visible to administrators' }),

      utility: new EmbedBuilder()
        .setColor('#39ff14')
        .setTitle('Utility Commands')
        .setDescription('Helpful tools and information commands.')
        .addFields(
          {
            name: '/botinfo',
            value:
              '**Description:** View bot information and statistics\n' +
              '**Options:** None\n' +
              '**Shows:** Uptime, server count, user count, ping, features, and links',
            inline: false
          },
          {
            name: '/bottime',
            value:
              '**Description:** Show current bot time and streak reset time\n' +
              '**Options:** None\n' +
              '**Shows:** Current UTC time and when gaming streaks reset (midnight UTC)',
            inline: false
          },
          {
            name: '/teststreakdm',
            value:
              '**Description:** Test streak DM notifications\n' +
              '**Options:** None\n' +
              '**Note:** Sends a test DM to verify notifications work',
            inline: false
          }
        )
        .setFooter({ text: 'Utility commands available to all users' }),

      silly: new EmbedBuilder()
        .setColor('#39ff14')
        .setTitle('Silly Commands')
        .setDescription('Entertainment and casual commands.')
        .addFields(
          {
            name: '/hopon',
            value:
              '**Description:** Request someone to hop on a game\n' +
              '**Options:**\n' +
              '• `user` - User to invite (required)\n' +
              '• `game` - Game name (autocompletes from their top games)\n' +
              '• `image` - Custom image attachment (optional)\n' +
              '• `imageurl` - Custom image URL (optional)\n' +
              '**Example:** `/hopon user:@friend game:Minecraft`',
            inline: false
          },
          {
            name: '/skysill',
            value:
              '**Description:** 50/50 spinner animation\n' +
              '**Options:** None',
            inline: false
          },
          {
            name: '/evie',
            value:
              '**Description:** Akechi rant\n' +
              '**Options:** None',
            inline: false
          },
          {
            name: '/pucas01',
            value:
              '**Description:** Link\n' +
              '**Options:** None',
            inline: false
          },
          {
            name: '/spencer',
            value:
              '**Description:** User mention\n' +
              '**Options:** None',
            inline: false
          },
          {
            name: '/cookieclouds',
            value:
              '**Description:** Twitch promo\n' +
              '**Options:** None',
            inline: false
          },
          {
            name: 'retro (Context Menu)',
            value:
              '**Description:** Right-click message → Apps → retro\n' +
              '**Action:** Replies "Ain\'t no way"\n' +
              '**Note:** Available via message context menu',
            inline: false
          }
        )
        .setFooter({ text: 'Silly commands for entertainment purposes' })
    };

    await interaction.reply({ embeds: [embeds[category]] });
  },
};
