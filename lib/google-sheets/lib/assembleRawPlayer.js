import sheetsGet from "./sheetsGet.js";

async function assembleRawPlayer({sheets, spreadsheetId, range, romData, nextGameId}){

const rawPlayerData = [];

const { awayTeamGoalieStats, awayTeamPlayerStats, homeTeamGoalieStats, homeTeamPlayerStats } = romData.data
const awayTeam = romData.data.awayTeamGameStats.AwayTeam
const homeTeam = romData.data.homeTeamGameStats.HomeTeam

const rawPlayerNextRowResponse = await sheetsGet({sheets, spreadsheetId, range}) 
const rawPlayerColH =  rawPlayerNextRowResponse.data.values || [] // Return the unique IDs
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
range: `RawPlayer!F${rawPlayerNextFreeRowNumber}:U${rawPlayerNextFreeRowNumber + rawPlayerData.length-1}`,
resource: {
    values: [...rawPlayerData]
}
}

return { rawPlayerEntries }

}

export default assembleRawPlayer;