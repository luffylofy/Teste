const { ApplicationCommandType, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { dbconfig } = require("../../DatabaseJson");

module.exports = {
    name: "roleall",
    description: "[ RoleAll ] Definir um cargo para todos os membros",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            type: 8,
            name: "cargo",
            description: "O cargo a ser definido para todos os membros",
            required: true
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            const config = await dbconfig.get(interaction.guild.id);

            if (!config) {
                return interaction.reply({ content: `**❌ | Você ainda não configurou seu servidor, utilize /painel.**`, ephemeral: true });
            }

            const cargosUsuario = interaction.member.roles.cache.map(role => role.id);
            const temCargo = config.roles.some(role => cargosUsuario.includes(role));
            const temPermissao = config.usersperms.includes(interaction.user.id);

            if (!temCargo && !temPermissao) {
                return interaction.reply({
                    content: `**❌ | Você não tem permissão para utilizar este comando.**`,
                    ephemeral: true
                });
            }
        }

        const cargo = interaction.options.getRole("cargo");
        const membros = interaction.guild.members.cache;
        const sucesso = [];
        const falha = [];

        if (cargo.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: `**❌ | Não posso atribuir um cargo mais alto ou igual ao meu.**`, ephemeral: true });
        }

        for (const membro of membros.values()) {
            if (membro.roles.cache.has(cargo.id)) continue;

            try {
                await membro.roles.add(cargo.id);
                sucesso.push(membro.user.tag);
            } catch (error) {
                falha.push(membro.user.tag);
                if (error.code === 50013) {
                    // Ignorar rate limit
                    break;
                }
            }
        }

        const mensagemSucesso = `✅ | Cargo ${cargo} foi atribuído com sucesso para **${sucesso.length}** membros.\n` +
            (falha.length > 0 ? `⚠️ | Não foi possível atribuir o cargo para **${falha.length}** membros. Verifique as permissões e o rate limit.` : '');

        const embedSucesso = new EmbedBuilder()
            .setAuthor({ name: 'Comando RoleAll', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(mensagemSucesso)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor('Green')
            .setTimestamp();

        await interaction.reply({ embeds: [embedSucesso], ephemeral: true });

        if (sucesso.length > 0) {
            const idCanalLogs = (await dbconfig.get(interaction.guild.id)).Logs;
            const canalLogs = client.channels.cache.get(idCanalLogs);

            if (canalLogs) {
                const embedLogs = new EmbedBuilder()
                    .setAuthor({ name: 'Logs de Comando', iconURL: 'https://cdn.discordapp.com/emojis/1270780955925155953.png?size=2048' })
                    .setTitle(`**Novo RoleAll Registrado**`)
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`👤 | **Atribuído por:** ${interaction.user}\n🎯 | **Cargo:** ${cargo}\n✅ | **Atribuído a:** ${sucesso.length} membros\n⚠️ | **Falhas:** ${falha.length} membros\n🕒 | **Data e Hora da Execução:** ${new Date().toLocaleString()}`)
                    .setColor('Random')
                    .setFooter({ text: `${interaction.guild.name}・`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();
                
                await canalLogs.send({ embeds: [embedLogs] });
            }
        }
    }
};
