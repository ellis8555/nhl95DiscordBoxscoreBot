import { readFileSync } from "node:fs"
import { join } from "node:path"

async function showRemainingGames(channelId, {client, coachId, leagueName, messageContent}){
    const channel = client.channels.cache.get(channelId)
    
    let uniqueIdFileName;
    let leagueConstants;
    let gamesPlayedVsOpponents
    let teamsCount
    let totalLeagueGamesPlayed
    let coaches
    try {
        if(leagueName === "W"){
            uniqueIdFileName = "wUniqueIds.csv"
            leagueConstants = await import("../constants/consts.js")
            const { bot_consts } = leagueConstants
            coaches = bot_consts.coaches
            gamesPlayedVsOpponents = bot_consts.w_games_vs_opponents
            teamsCount = bot_consts.teamCodes.length
            totalLeagueGamesPlayed = (teamsCount * ((teamsCount - 1) * gamesPlayedVsOpponents)) / 2
        }
    
        const uniqueIdFilePath = join(process.cwd(), "public", uniqueIdFileName)
        const gameData = readFileSync(uniqueIdFilePath, "utf-8")
        const gamesPlayedArray = gameData.match(/([A-Z]{3}\/[A-Z]{3})/g)

        const gamesPlayed = gamesPlayedArray.length/2
        if(gamesPlayed > 20){
            await channel.send(`There are still ${gamesRemaining} games still to be played.`)
        }
        if(gamesPlayed < 21){
            await channel.send('To display remaining matchups')
        }
    } catch (error) {
        
    }


}

export default showRemainingGames