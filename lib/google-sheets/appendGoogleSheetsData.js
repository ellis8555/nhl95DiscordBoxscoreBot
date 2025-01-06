async function appendGoogleSheetsData({sheets, spreadsheetId, romData}) {

let range;
const sheetEntries = [];

try {
    const { tempCSVData } = romData;
    const { awayTeamGoalieStats, awayTeamPlayerStats, homeTeamGoalieStats, homeTeamPlayerStats, allPenalties, allGoalsScored } = romData.data
    const awayTeam = romData.data.awayTeamGameStats.AwayTeam
    const homeTeam = romData.data.homeTeamGameStats.HomeTeam

    ////////////////////
    // begin RawData tab 
    ////////////////////

    // get how many rows down new data to be appended
    range = "RawData!H:H";

    const nextRowResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    });
    const rawDataColH =  nextRowResponse.data.values // Return the unique IDs
    const rawDataNextFreeRowNumber = rawDataColH.length + 1;
    
    // get the most recent game_id
    range = `RawData!A${rawDataNextFreeRowNumber}:A${rawDataNextFreeRowNumber}`;
    
    const nextGameIdResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    });
    
    // used to place into other tabs within the table which need the game id
    const nextGameId = nextGameIdResponse.data.values.flat()[0];

    const rawGameData = [];
    
    tempCSVData.slice(1, 62).forEach((dataSet) => {
        rawGameData.push(dataSet[1]);
    });

    const rawDataEntries = {
        range: `RawData!H${rawDataNextFreeRowNumber}`,
        resource: {
        values: [rawGameData]
        }
    }
    // TODO:
    sheetEntries.push(rawDataEntries)
    //////////////////////
    // begin rawPlayer tab
    //////////////////////

    const rawPlayerData = [];


        // get how many rows down new data to be appended
    range = "RawPlayer!H:H";

    const rawPlayerNextRowResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    });
    const rawPlayerColH =  rawPlayerNextRowResponse.data.values // Return the unique IDs
    const rawPlayerNextFreeRowNumber = rawPlayerColH.length + 1;
    const awayGoaliesPlayed = awayTeamGoalieStats.filter(goalie => goalie.TOI !== "0:00")
    // remove SV% as it's not used in sheets
    awayGoaliesPlayed.forEach(goalie => {
    delete goalie['SV%'];
    });
    const homeGoaliesPlayed = homeTeamGoalieStats.filter(goalie => goalie.TOI !== "0:00")
    // remove SV% as it's not used in sheets
    homeGoaliesPlayed.forEach(goalie => {
    delete goalie['SV%'];
    });

    awayGoaliesPlayed.forEach(goalie => {
    const tempGoalieArray = [nextGameId, awayTeam];
    for(let goalieStat in goalie){
        tempGoalieArray.push(goalie[goalieStat])
    }
    rawPlayerData.push(tempGoalieArray)
    })
    homeGoaliesPlayed.forEach(goalie => {
    const tempGoalieArray = [nextGameId, homeTeam];
    for(let goalieStat in goalie){
        tempGoalieArray.push(goalie[goalieStat])
    }
    rawPlayerData.push(tempGoalieArray)
    })
    const awayPlayersPlayed = awayTeamPlayerStats.filter(player => (player.TOI !== "0:00" && player.TOI !== "-"))
    awayPlayersPlayed.forEach(player => {
    const tempArray = [nextGameId, awayTeam]
    for (let playerStat in player){
        tempArray.push(player[playerStat])
    }
    tempArray.splice(10, 0, 0, 0, 0)
    rawPlayerData.push(tempArray)
    })

    const homePlayersPlayed = homeTeamPlayerStats.filter(player => (player.TOI !== "0:00" && player.TOI !== "-"))
    homePlayersPlayed.forEach(player => {
    const tempArray = [nextGameId, homeTeam]
    for (let playerStat in player){
        tempArray.push(player[playerStat])
    }
    tempArray.splice(10, 0, 0, 0, 0)
    rawPlayerData.push(tempArray)
    })
    const rawPlayerEntries = {
    range: `RawPlayer!F${rawPlayerNextFreeRowNumber}`,
    resource: {
        values: [...rawPlayerData]
    }
    }
    // TODO:
    sheetEntries.push(rawPlayerEntries)
    ///////////////////
    // begin rawPenalty
    ///////////////////

    const rawPenaltyData = [];

    // get how many rows down new data to be appended
    range = "RawPenalty!H:H";

    const rawPenaltyNextRowResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    });
    const rawPenaltyColH =  rawPenaltyNextRowResponse.data.values // Return the unique IDs
    const rawPenaltyNextFreeRowNumber = rawPenaltyColH.length + 1;

    allPenalties.forEach(penalty => {
    const tempArray = [nextGameId];
    for (let penaltyStat in penalty){
        tempArray.push(penalty[penaltyStat])
    }
    rawPenaltyData.push(tempArray)
    })

    const rawPenaltyEntries = {
    range: `RawPenalty!F${rawPenaltyNextFreeRowNumber}`,
    resource: {
        values: [...rawPenaltyData]
    }
    }
    // TODO:
    sheetEntries.push(rawPenaltyEntries)

    ////////////////////
    // begin rawScoring
    ////////////////////
    const rawScoringData = [];

        // get how many rows down new data to be appended
        range = "RawScoring!H:H";

        const rawScoringNextRowResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        });
        const rawScoringColH =  rawScoringNextRowResponse.data.values // Return the unique IDs
        const rawScoringNextFreeRowNumber = rawScoringColH.length + 1;

        allGoalsScored.forEach(goal => {
        const tempArray = [nextGameId];
        for (let goalStat in goal){
            tempArray.push(goal[goalStat])
        }
        // rawScoring in last columns duplicates most of the goal summary
        const appendedDuplicateSummary = [...tempArray, ...tempArray.slice(2)] 
        rawScoringData.push(appendedDuplicateSummary)
        })
        const rawScoringEntries = {
        range: `RawScoring!F${rawScoringNextFreeRowNumber}`,
        resource: {
            values: [...rawScoringData]
        }
        }
        // TODO:
        sheetEntries.push(rawScoringEntries)

    /////////////////////////////////////
    // send all requests to google sheets
    /////////////////////////////////////

// Use for ... of loop for async/await
for (const entry of sheetEntries) {
    const { range, resource } = entry;
    await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW", // Options: RAW or USER_ENTERED
    resource,
    });
}
} catch (error) {
    return {status: "error", message: "Failed to append to google sheets", errorMessage: error.message}
}
}

export default appendGoogleSheetsData;