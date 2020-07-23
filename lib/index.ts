import Scanner from './GiftScanner';
require('dotenv').config();

const tokens = process.env.TOKENS.split(',');
const sharedCodesList: string[] = [];

let missVars = ['TOKENS', 'REDTOKEN', 'LOGCHANNELID', 'LOGGUILDID'].filter(v => !process.env[v]);
if(missVars.length != 0)
    throw Error("Missing some requred variables: " + missVars.join(", "));

tokens.forEach((token, i) => {
    console.log(`Initializing ${i+1} of ${tokens.length} scanners...`);
    new Scanner(
        token,
        process.env.REDTOKEN,
        process.env.LOGCHANNELID,
        process.env.LOGGUILDID,
        sharedCodesList
    );
});