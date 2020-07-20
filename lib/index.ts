import Discord from 'discord.js';
import https from 'https';
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
    if(msg.guild?.id == '426486206671355914') {
        if(msg.content.startsWith('...stats')) {
            let emb = new Discord.RichEmbed().setColor('#9676ef').setAuthor('Statystyki')
            .addField('Serwery', bot.guilds.size, true).addField('Kanały', bot.channels.size, true)
            .addField('W filtrze', usedList.length, true)
            .addField('Ost. Wiad.', `**${lastmsg.author.tag}** w **${lastmsg?.guild.name || 'DM'}**\n` + lastmsg?.content?.slice(0, 1000));
            msg.channel.send(emb);
        }
        else if(msg.content.startsWith('...ping')) {
            msg.channel.send(new Discord.RichEmbed().setColor('#1ece00').setDescription(`**${msg.author.tag}** :ping_pong: ${bot.ping}ms`));
        }
        return;
    }
    
    lastmsg = msg;
    
    let test = /discord\.gift\/([\d\w]{1,19})(?: |$)/im.exec(msg.content);
    if(test) {
        let giftCode = test[1];
        if(usedList.includes(giftCode))
            return;
        usedList.push(giftCode);

        if(giftCode.length == 16)
            redeemCode(giftCode);
        else if(giftCode.length > 16)
            redeemCode(giftCode.slice(0, 16));
        else {
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
        
        logChan.send(msg.content);
        logChan.send(`Od: **@${msg.author.tag}**\nw **#${(msg.channel as Discord.TextChannel)?.name || 'DM'}**\nna **${msg.guild?.name || 'DM'}**`);
    }
});

async function redeemCode(code: string) {
    try {
        let rq = https.request({
            hostname: 'discordapp.com',
            port: 443,
            path: `/api/v6/entitlements/gift-codes/${code}/redeem`,
            method: 'POST',
            headers: {
                Authorization: redeemToken, 
                'Content-Type': 'application/json',
            }
        }, resp => {
            let body = '';
            resp.on('data', d => body += d);
            resp.on('end', () => {
                logChan.send(`kod: **${code}**`);
                logChan.send("Wynik próby odebrania prezentu:\n\n" + JSON.stringify(JSON.parse(body), null, 2), {code: 'json', split: true});
            });
            
        });
        rq.write(`{
            "channel_id": null,
            "payment_source_id": null
        }`);
        rq.end();
    }
    catch(err) {
        console.error(err);
        logChan.send(`Request error:\n\n` + err.message);
    }
}