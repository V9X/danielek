import Discord, { TextChannel } from 'discord.js';
import ax from 'axios';
import { send } from 'process';
require('dotenv').config();
const bot = new Discord.Client();

let lastmsg: Discord.Message;
let logChan: Discord.TextChannel;
let usedList: string[] = [];
const token = process.env.TOKEN;
const redeemToken = process.env.REDTOKEN;
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
        .addField('W filtrze', usedList.length, true)
        .addField('Ost. Wiad.', `**${lastmsg.author.tag}** w **${lastmsg?.guild.name || 'DM'}**\n` + lastmsg?.content?.slice(0, 1000));
        logChan.send(emb);
    }
    else if(msg.guild?.id == '426486206671355914')
        return;
    
    lastmsg = msg;
    
    let test = /discord\.gift\/([\d\w]{1,19})(?: |$)/im.exec(msg.content);
    if(test) {
        let giftCode = test[1];
        if(usedList.includes(giftCode))
            return;
        usedList.push(giftCode);

        if(giftCode.length > 16)
            redeemCode(giftCode.slice(0, 16));
        else if(giftCode.length < 16) {
            let words = msg.content.replace(/[^0-9A-Za-z ]/g, '').split(' ').filter(s => (giftCode + s).length == 16);
            if(words.length == 0)
                return;
            (async () => {
                for(let word of words) {
                    redeemCode(giftCode + word);
                    await new Promise(r => setTimeout(r, 100));
                }
            })();
        }
        else
            redeemCode(giftCode);
        
        logChan.send(msg.content);
        logChan.send(`Od: **@${msg.author.tag}**\nw **#${(msg.channel as TextChannel)?.name || 'DM'}**\nna **${msg.guild?.name || 'DM'}**`);
    }
});

function redeemCode(code: string) {
    ax.post(`https://discordapp.com/api/v6/entitlements/gift-codes/${code}/redeem`, 
    {
        channel_id: null,
        payment_source_id: null
    }, 
    {
        headers: {
            Authorization: redeemToken, 
            'Content-Type': 'application/json', 
        },
        responseType: 'json',
        validateStatus: () => true
    }).then(resp => {
        logChan.send(`kod: **${code}**`);
        logChan.send("Wynik próby odebrania prezentu:\n\n" + JSON.stringify(resp.data, null, 2), {code: 'json', split: true});
    });
}