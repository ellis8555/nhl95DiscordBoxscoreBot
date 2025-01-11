import { pure_consts } from "../constants/pureConsts.js";

const {
    listeningChannel,
    pureLeagueScoreExpression,
    currentSeason,
    appendGoogleSheets,
    teamCodesList,
} = pure_consts

const { countRowRange } = appendGoogleSheets
const { col_start, col_end } = appendGoogleSheets.rawSchedule;

async function processPure({sheets, message}){
    let pureScoreChannelId;
    
    try {
    // get channel bot is listening to in pure league
    const channel = message.guild.channels.cache.find(channel => channel.name === listeningChannel)

    if(channel){
        pureScoreChannelId = channel.id;
        if (message.channel.id !== pureScoreChannelId) return; 
    } else {
        console.log(`Channel ${listeningChannel} not found.`)
        return;
    }

    // begin processing a score
    const getScore = message.content;
    const isInScoreFormat = pureLeagueScoreExpression.test(getScore); // test for score pattern

    if(!isInScoreFormat) return;

    const scoreParts = getScore.split(" ").filter(part => part !== "" && part !== "-");
    const homeTeam = scoreParts[0].toUpperCase();
    const awayTeam = scoreParts[2].toUpperCase();

    const teamsVerify = teamCodesList.includes(homeTeam) && teamCodesList.includes(awayTeam)
    if(!teamsVerify){
        throw new Error("Check the teams abbreviation as it needs to match from a list.\nThe list is pinned here in the channel.")
    }

    const homeTeamScore = scoreParts[1];
    const awayTeamScore = scoreParts[3];

    const spreadsheetId = process.env.pureLeagueSpreadSheetId;
    let range = `RawSchedule!${countRowRange}`

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    })

    if(res.status !== 200 || res.statusText !== "OK"){
        throw new Error("Error in reading RawSchedule sheet")
    }

    const rows = res.data.values;
    const rowLength = rows.length;
    if(rowLength < 1){
        throw new Error("RawSchedule is empty.")
    }

    let homeTeamRowNumber;
    let homeTeamRowNumberFound = false;
    let homeTeamResult;
    let awayTeamResult;
        
    // find the row that finds the matchup in the current season
    for (let index = 0; index < rowLength; index++) {
        const game = rows[index];
        if (game[4] === currentSeason && game[8] === homeTeam && game[11] === awayTeam) {
            homeTeamRowNumber = index + 2;
            homeTeamRowNumberFound = true;
            break;
        }
    }

    if(!homeTeamRowNumber){
        throw new Error("This matchup was not found.")
    }

    // check for blank entry to ensure this matchup has not been entered already
    range = `RawSchedule!${col_start}${homeTeamRowNumber}:${col_end}${homeTeamRowNumber}`;
    const checkForPreviousResult =  await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    })

    // not blank error
    if(checkForPreviousResult.data.values){ 
        throw new Error(`This matchup may have occured already. Check the sheet \`at line: ${homeTeamRowNumber}\``)
    }

    // assign result status to each team
    if(+homeTeamScore > +awayTeamScore){
        homeTeamResult = "W";
        awayTeamResult = "L";
    } else if (+homeTeamScore < +awayTeamScore){
        homeTeamResult = "L";
        awayTeamResult = "W";
    } else {
        homeTeamResult = "T";
        awayTeamResult = "T";
    }

    const requests = [];
    try {            
        if (homeTeamRowNumberFound) {
            requests.push({
                range: `RawSchedule!J${homeTeamRowNumber}:K${homeTeamRowNumber}`,
                values: [
                    [homeTeamResult, homeTeamScore], // Update only column N for the home team
                ],
            });
            requests.push({
                range: `RawSchedule!M${homeTeamRowNumber}:N${homeTeamRowNumber}`,
                values: [
                    [awayTeamResult, awayTeamScore], // Update only column N for the away team
                ],
            });

                // enter the game score
            if (requests.length > 0) {
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        data: requests,
                        valueInputOption: "RAW", // Use "RAW" or "USER_ENTERED"
                    },
                });
            }
        }
    } catch (error) {
        throw new Error("Error in trying to update RawSchedule")
    }

    // all success
    await message.react('✅')

    } catch (error) {
        await message.channel.send(`❌: ${error.message}`)
    }
}

export default processPure;