import { pure_consts } from "./consts/pureConsts.js";

const {
    listeningChannel,
    outputChannel,
    pureLeagueScoreExpression
} = pure_consts

async function processPure({sheets, message}){
    const outputChannelName = outputChannel

    let pureScoreChannelId;
    let outputChannelId;
    
    // get channel bot is listening to in pure league
    const channel = message.guild.channels.cache.find(channel => channel.name === listeningChannel)

    if(channel){
        pureScoreChannelId = channel.id;
        if (message.channel.id !== pureScoreChannelId) return; 
    } else {
        console.log("Channel 'admin-boxscores' not found.")
    }

    // begin processing a score
    const getScore = message.content;
    const isInScoreFormat = pureLeagueScoreExpression.test(getScore); // test for score pattern

    if(!isInScoreFormat) return; //exit if not score pattern;

      const spreadsheetId = process.env.pureLeagueSpreadSheetId;

}

export default processPure;