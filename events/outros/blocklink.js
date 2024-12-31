require('../../index')

const Discord = require('discord.js')
const client = require('../../index')

const { QuickDB } = require("quick.db")
const db = new QuickDB();

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    let confirm = await db.get(`antilink_${message.guild.id}`);
    if (confirm === false || confirm === null) {
      return;
    } else if (confirm === true) {
      if (message.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return;
      if (message.content.toLocaleLowerCase().includes("http")) {
        message.delete()
        message.channel.send(`${message.author} Não envie links no servidor!`)
      }
  
    }
  });
  