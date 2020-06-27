import Discord, { TextChannel } from 'discord.js';
require('dotenv').config();
const bot = new Discord.Client();

let lastmsg: Discord.Message;
let logChan: Discord.TextChannel;
const token = process.env.TOKEN;
const logChId = '726170857071968357';

bot.login(token);
bot.on('ready', () => {
    console.log(`Zalogowano jako ${bot.user.tag}`);
    logChan = bot.channels.get(logChId) as Discord.TextChannel;
});

bot.on('message', async msg => {
    if(msg.content.startsWith('...stats') && msg.channel.id == logChId) {
        let emb = new Discord.RichEmbed().setColor('#9676ef').setAuthor('Statystyki')
        .addField('Serwery', bot.guilds.size, true).addField('Kanały', bot.channels.size, true)
        .addField('Ost. Wiad.', `**${lastmsg.author.tag}** w **${lastmsg?.guild.name || 'DM'}**\n` + lastmsg?.content?.slice(0, 1000));
        logChan.send(emb);
    }
    else if(msg.guild?.id == '426486206671355914')
        return;
    
    lastmsg = msg;
    if(msg.content.includes('discord.gift/')) {
        logChan.send(msg.content);
        logChan.send(`Od: **@${msg.author.tag}** w **#${(msg.channel as TextChannel)?.name || 'DM'}** na **${msg?.guild.name || 'DM'}**`);
        logChan.send('@everyone');
    }
});