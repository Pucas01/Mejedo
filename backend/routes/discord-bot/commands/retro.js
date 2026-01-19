import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('retro')
    .setType(ApplicationCommandType.Message),

  async execute(interaction) {
    const message = interaction.targetMessage;
    await message.reply('Ain\'t no way :exploding_head:');
    await interaction.reply({ content: 'Done', ephemeral: true });
  },
};
