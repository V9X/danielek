import { Client, TextChannel, Message, RichEmbed } from "discord.js";
import https from 'https';

export default class extends Client {
    private readonly logId: string;
    private readonly logGuildId: string;
    private readonly redeemToken: string;
    private logChannel: TextChannel;
    private sharedUsedList: string[];
    private lastMessage: Message;
    private readonly giftRegex = /discord\.gift\/([\d\w]{1,19})(?: |$)/im;

    constructor(token: string, rToken: string, logId: string, logGuildId: string, uList: string[]) {
        super();
        this.token = token;
        this.redeemToken = rToken;
        this.logId = logId;
        this.logGuildId = logGuildId;
        this.sharedUsedList = uList;
        this.start();
    }

    private start() {
        super.login(this.token);
        this.on('ready', () => this.onReady());
        this.on('message', msg => this.onMessage(msg));
    }

    private onReady() {
        console.log(`Zalogowano jako ${this.user.tag}`);
        this.logChannel = this.channels.get(this.logId) as TextChannel;
    }

    private async onMessage(msg: Message) {
        if(msg.guild?.id == this.logGuildId) {
            this.handleCommands(msg);
            return;
        }
        
        this.lastMessage = msg;
        
        let test = this.giftRegex.exec(msg.content);
        if(test) {
            let giftCode = test[1];
            if(this.sharedUsedList.includes(giftCode))
                return;
            this.sharedUsedList.push(giftCode);
    
            if(giftCode.length == 16)
                this.redeemCode(giftCode);
            else if(giftCode.length > 16)
                this.redeemCode(giftCode.slice(0, 16));
            else {
                let words = msg.content.replace(/[^0-9A-Za-z ]/g, '').split(' ').filter(s => (giftCode + s).length == 16);
                if(words.length == 0)
                    return;
                (async () => {
                    for(let word of words) {
                        this.redeemCode(giftCode + word);
                        await new Promise(r => setTimeout(r, 100));
                    }
                })();
            }
            
            this.logChannel.send(msg.content);
            this.logChannel.send(`Od: **@${msg.author.tag}**\nw **#${(msg.channel as TextChannel)?.name || 'DM'}**\nna **${msg.guild?.name || 'DM'}**`);
        }
    }

    private handleCommands(msg: Message) {
        if(msg.content.startsWith('...stats')) {
            let emb = new RichEmbed().setColor('#9676ef').setAuthor('Statystyki')
            .addField('Serwery', this.guilds.size, true).addField('Kanały', this.channels.size, true)
            .addField('W filtrze', this.sharedUsedList.length, true)
            .addField('Ost. Wiad.', `**${this.lastMessage.author.tag}** w **${this.lastMessage?.guild.name || 'DM'}**\n` + this.lastMessage?.content?.slice(0, 1000));
            msg.channel.send(emb);
        }
        else if(msg.content.startsWith('...ping')) {
            msg.channel.send(new RichEmbed().setColor('#1ece00').setDescription(`**${msg.author.tag}** :ping_pong: ${this.ping}ms`));
        }
    }

    private async redeemCode(code: string) {
        try {
            let rq = https.request({
                hostname: 'discordapp.com',
                port: 443,
                path: `/api/v6/entitlements/gift-codes/${code}/redeem`,
                method: 'POST',
                headers: {
                    Authorization: this.redeemToken, 
                    'Content-Type': 'application/json',
                }
            }, resp => {
                let body = '';
                resp.on('data', d => body += d);
                resp.on('end', () => {
                    this.logChannel.send(`kod: **${code}**`);
                    this.logChannel.send("Wynik próby odebrania prezentu:\n\n" + JSON.stringify(JSON.parse(body), null, 2), {code: 'json', split: true});
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
            this.logChannel.send(`Request error:\n\n` + err.message);
        }
    }
}