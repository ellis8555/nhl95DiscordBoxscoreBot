import fs from "node:fs"
import path from "node:path"
import { pure_consts } from "../constants/consts.js";

const {
    pure_Server,
    listeningChannel,
    pureLeagueScoreExpression,
    editPermission,
    writeToGoogleSheets,
    currentSeason,
    appendGoogleSheets,
    teamCodesList,
    coaches
} = pure_consts

const { countRowRange, standings } = appendGoogleSheets
const { 
    col_start_search, 
    col_end_search,
    col_start_home,
    col_end_home,
    col_start_away,
    col_end_away 
    } = appendGoogleSheets.rawSchedule;

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

    // check incoming message for format of a score
    const getScore = message.content;
    const scorePatternTest = new RegExp(pureLeagueScoreExpression)
    const isInScoreFormat = scorePatternTest.test(getScore); // test for score pattern

    if(!isInScoreFormat) return // ignore all messages except score related

    const scoreParts = getScore.split(" ").filter(part => part !== "" && part !== "-"); // split up the entered score remove spaces
    let isEntryAnEdit = false // boolean to set flag allowing overwrite
    // check if this entry is an edit
    if(scoreParts[0] === "EDIT"){
        scoreParts.shift(); // remove "EDIT" from the array for the below variables
        // test the author id to see if permission allowed for an edit
        const getAuthorId = message.author.id;
        const authorizedEditors = Object.values(editPermission); // list of authorized id's
        if(authorizedEditors.includes(getAuthorId)){
            isEntryAnEdit = true; // in edit score mode
        } else {
            throw new Error("Permission required to make edits.") // unauthorized edit
        }
    }

    const homeTeam = scoreParts[0].toUpperCase();
    const awayTeam = scoreParts[2].toUpperCase();

    const teamsVerify = teamCodesList.includes(homeTeam) && teamCodesList.includes(awayTeam) // check abbreviations are correct

    if(!teamsVerify){ // incorrect abbreviation entered
        throw new Error("Check the teams abbreviation as it needs to match from a list.")
    }

    const homeTeamScore = scoreParts[1];
    const awayTeamScore = scoreParts[3];

    if(+homeTeamScore > 50 || +awayTeamScore > 50){ // don't allow goal entries above 50
        throw new Error("Scores can't be higher than 50.")
    }

    const spreadsheetId = process.env.pureLeagueSpreadSheetId; // begin reading the sheet
    let range = `RawSchedule!${countRowRange}`

    const res = await sheets.spreadsheets.values.get({ // this gets every row in RawSchedule
        spreadsheetId,
        range,
    })

    if(res.status !== 200 || res.statusText !== "OK"){
        throw new Error("Error in reading RawSchedule sheet")
    }

    const rows = res.data.values; // all rows received
    const rowLength = rows.length;  // row count
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
        if (game[4] === currentSeason && game[8] === homeTeam && game[11] === awayTeam) { // season num, hometeam, awayteam
            homeTeamRowNumber = index + 2;
            homeTeamRowNumberFound = true;
            break; // as soon as a match is found stop looking
        }
    }

    if(!homeTeamRowNumber){
        throw new Error("This matchup was not found.")
    }

    if(!isEntryAnEdit){ // bypass if authorized edit is being made
        // check teams/score cells are empty to ensure this matchup has not been entered already
        range = `RawSchedule!${col_start_search}${homeTeamRowNumber}:${col_end_search}${homeTeamRowNumber}`;
        const checkForPreviousResult =  await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        })

        // not blank error
        if(checkForPreviousResult.data.values){ 
            throw new Error(`This matchup may have occured already. Check the sheet \`at line: ${homeTeamRowNumber}\``)
        }
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

    // assign coaches name which will be used for updating streak column further down
    // these are assigned in upcoming coaches forEach loop
    let homeCoach
    let awayCoach
    let updatedHomeStreak
    let updatedAwayStreak

    // update each teams streak
    coaches.forEach((coachObject, index) => {

        // set home teams streak
        if(coachObject.team === homeTeam){
            homeCoach = coachObject.sheetsUser
            if(coachObject.streak === "-"){
                coaches[index].streak = "1" + homeTeamResult
                updatedHomeStreak = "1" + homeTeamResult
            } else {
                const currentHomeStreak = coaches[index].streak
                const lengthOfStreakString = currentHomeStreak.length
                    let previousStreakLength;
                    let previousStreakType;
                    let updatedStreakLength;
                    let updatedStreaktype;
                    //extract streakLength and streak type from previously set streak
                    // if streak is single digit
                    if(lengthOfStreakString === 2){
                        previousStreakLength = currentHomeStreak.charAt(0);
                        previousStreakType = currentHomeStreak.charAt(1)
                    }
                    // if streak is in double digits
                    if(lengthOfStreakString === 3){
                        previousStreakLength = currentHomeStreak.charAt(0) + currentHomeStreak.charAt(1)
                        previousStreakType = currentHomeStreak.charAt(2)
                    }
                    // begin setting new streak strings
                    if(homeTeamResult === "W"){
                        if(previousStreakType === "W"){
                            updatedStreakLength = +previousStreakLength + 1
                        } else {
                            updatedStreakLength = 1
                        }
                        updatedStreaktype = "W"
                    }
                    if(homeTeamResult === "L"){
                        if(previousStreakType === "L"){
                            updatedStreakLength = +previousStreakLength + 1
                        } else {
                            updatedStreakLength = 1
                        }
                        updatedStreaktype = "L"
                    }
                    if(homeTeamResult === "T"){
                        if(previousStreakType === "T"){
                            updatedStreakLength = +previousStreakLength + 1
                        } else {
                            updatedStreakLength = 1
                        }
                        updatedStreaktype = "T"
                    }
                    coaches[index].streak = updatedStreakLength.toString() + updatedStreaktype;
                    updatedHomeStreak = updatedStreakLength.toString() + updatedStreaktype
            }
        }

        // set away teams streak
        if(coachObject.team === awayTeam){
            awayCoach = coachObject.sheetsUser
            if(coachObject.streak === "-"){
                coaches[index].streak = "1" + awayTeamResult
                updatedAwayStreak = "1" + awayTeamResult
            } else {
                const currentAwayStreak = coaches[index].streak
                const lengthOfStreakString = currentAwayStreak.length
                    let previousStreakLength;
                    let previousStreakType;
                    let updatedStreakLength;
                    let updatedStreaktype;
                    //extract streakLength and streak type from previously set streak
                    // if streak is single digit
                    if(lengthOfStreakString === 2){
                        previousStreakLength = currentAwayStreak.charAt(0);
                        previousStreakType = currentAwayStreak.charAt(1)
                    }
                    // if streak is in double digits
                    if(lengthOfStreakString === 3){
                        previousStreakLength = currentAwayStreak.charAt(0) + currentAwayStreak.charAt(1)
                        previousStreakType = currentAwayStreak.charAt(2)
                    }
                    // begin setting new streak strings
                    if(awayTeamResult === "W"){
                        if(previousStreakType === "W"){
                            updatedStreakLength = +previousStreakLength + 1
                        } else {
                            updatedStreakLength = 1
                        }
                        updatedStreaktype = "W"
                    }
                    if(awayTeamResult === "L"){
                        if(previousStreakType === "L"){
                            updatedStreakLength = +previousStreakLength + 1
                        } else {
                            updatedStreakLength = 1
                        }
                        updatedStreaktype = "L"
                    }
                    if(awayTeamResult === "T"){
                        if(previousStreakType === "T"){
                            updatedStreakLength = +previousStreakLength + 1
                        } else {
                            updatedStreakLength = 1
                        }
                        updatedStreaktype = "T"
                    }
                    coaches[index].streak = updatedStreakLength.toString() + updatedStreaktype;
                    updatedAwayStreak = updatedStreakLength.toString() + updatedStreaktype
            }
        }
    })

    // update the server file containing coaches objects
    try {        
        const filepath = path.join(process.cwd(), "public", "json", "pure_bot_constants.json");
        const updatedPureConsts = {
            listeningChannel,
            pureLeagueScoreExpression,
            editPermission,
            writeToGoogleSheets,
            currentSeason,
            appendGoogleSheets,
            teamCodesList,
            coaches
        }
        fs.writeFileSync(filepath, JSON.stringify(updatedPureConsts, null, 2))
    } catch (error) {
        throw new Error("error in updating server file pure_bot_constants.json")
    }

    if(writeToGoogleSheets){
        const requests = [];
        try {            
            if (homeTeamRowNumberFound) {
                requests.push({
                    range: `RawSchedule!${col_start_home}${homeTeamRowNumber}:${col_end_home}${homeTeamRowNumber}`,
                    values: [
                        [homeTeamResult, +homeTeamScore], // Update only column N for the home team
                    ],
                });
                requests.push({
                    range: `RawSchedule!${col_start_away}${homeTeamRowNumber}:${col_end_away}${homeTeamRowNumber}`,
                    values: [
                        [awayTeamResult, +awayTeamScore], // Update only column N for the away team
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
                    })   
                    
                // begin writing streaks into standings sheet

                // get correct rows in standings sheet to update a coaches streak
                range = `Standings!${standings.manager_col_start}:${standings.manager_col}`

                const managers_res = await sheets.spreadsheets.values.get({ // this gets every row in RawSchedule
                    spreadsheetId,
                    range,
                })

                if(managers_res.status !== 200 || managers_res.statusText !== "OK"){
                    throw new Error("Error in reading standings sheet in order to get coaches row")
                }

                // get list of coaches in current season
                const manager_rows = managers_res.data.values.flat();
                // look for entry that indicates past players list
                const findPlayersEnd = manager_rows.indexOf("REMAINING SCHEDULE")
                // remove entries that are not players
                manager_rows.splice(findPlayersEnd)

                const filepath = path.join(process.cwd(), "public", "json", "pure_bot_constants.json");
                const leagueConsts = fs.readFileSync(filepath, "utf-8");
                const updatedPureConsts = JSON.parse(leagueConsts)
                const updatedCoachesObjects = updatedPureConsts.coaches

                const managerStreakObjects = []
                manager_rows.forEach((manager, index) => {
                    const coachDetails = {}
                    coachDetails.user = manager;
                    const coachObject = updatedCoachesObjects.find(coach => coach.sheetsUser === manager)
                    coachDetails.streak = coachObject?.streak
                    coachDetails.sheetsStandingsRowNumber = index + 5
                    managerStreakObjects.push(coachDetails)
                    })

                const updateStreakRequests = []
                managerStreakObjects.forEach(manager => {
                    updateStreakRequests.push({
                        range: `Standings!${standings.streak_col}${manager.sheetsStandingsRowNumber}`,
                        values: [
                            [manager.streak], // Update only column N for the away team
                        ]
                    })
                })
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        data: updateStreakRequests,
                        valueInputOption: "RAW", // Use "RAW" or "USER_ENTERED"
                    },
                })
                }
            }

        } catch (error) {
            throw new Error("Error in trying to update RawSchedule")
        } finally {
            // reset edit status
            isEntryAnEdit = false;
        }
    }

    // all success
    await message.react('✅')

    } catch (error) {
        await message.channel.send(`❌: ${error.message}`)
    }
}

export default processPure;