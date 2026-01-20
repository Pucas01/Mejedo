import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('retro')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    try {
      const message = interaction.targetMessage;

      if (message.channel) {
        await message.reply('Ain\'t no way :exploding_head:');
        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();
      } else {
        await interaction.reply({ content: 'Ain\'t no way :exploding_head:', ephemeral: false });
      }
    } catch (error) {
      console.error('Error in retro command:', error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Ain\'t no way :exploding_head:', ephemeral: false });
        }
      } catch (err) {
        console.error('Error in fallback reply:', err);
      }
    }
  },
};
