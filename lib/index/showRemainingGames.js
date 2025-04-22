import { readFileSync } from "node:fs"
import { join } from "node:path"

async function showRemainingGames(channelId, {client, coachId, leagueName, messageContent}){
    const channel = client.channels.cache.get(channelId)
    
    let uniqueIdFileName;
    let leagueConstants;
    let gamesPlayedVsOpponents
    let teamsCount
    let teamsList
    let totalLeagueGamesToBePlayed
    let coaches
    let playersToIgnore
    try {
        if(leagueName === "W"){
            uniqueIdFileName = "wUniqueIds.csv"
            leagueConstants = await import("../constants/consts.js")
            const { bot_consts } = leagueConstants
            teamsList = bot_consts.teamCodes
            coaches = bot_consts.coaches
            gamesPlayedVsOpponents = bot_consts.w_games_vs_opponents
            teamsCount = bot_consts.teamCodes.length
                    // create array of teams to ignore due to not being able to complete a season or who aren't playing at all
            playersToIgnore = ["KVK", "MGG", "SUN"]
        }
        const uniqueIdFilePath = join(process.cwd(), "public", uniqueIdFileName)
        const gameData = readFileSync(uniqueIdFilePath, "utf-8")
        const gamesPlayedArray = gameData.match(/([A-Z]{3}\/[A-Z]{3})/g)
        const duplicatesRemovedGamesPlayedArray = Array.from(new Set(gamesPlayedArray))

        // teams count originally is size of array in .py file which need to included in right side of equestion
        // minus out those players who's games need to be wiped on left side of equation
        totalLeagueGamesToBePlayed = ((teamsCount - playersToIgnore.length) * (((teamsCount - playersToIgnore.length) - 1) * gamesPlayedVsOpponents)) / 2
        // remove players to ignore from games played list
        // remove backwards to not mess up index numbering
        for (let i = duplicatesRemovedGamesPlayedArray.length - 1; i >= 0; i--) {
            const game = duplicatesRemovedGamesPlayedArray[i];
            const [team1, team2] = game.split('/');
            
            // Check if either team is in the ignore list
            if (playersToIgnore.includes(team1) || playersToIgnore.includes(team2)) {
                duplicatesRemovedGamesPlayedArray.splice(i, 1); // Remove the game if it contains an ignored team
            }
        }
        // count used to determine when to begin gathering remaining games data and displaying to user
        const gamesRemainingToBePlayed = totalLeagueGamesToBePlayed - duplicatesRemovedGamesPlayedArray.length

        if(gamesRemainingToBePlayed > 20){
            await channel.send(`\`${gamesRemainingToBePlayed}\` games left to be played`)
        }
        if(gamesRemainingToBePlayed < 21 && gamesRemainingToBePlayed !== 0){  
                // create array which will hold remaining matchups
                let remainingMatchUps = []
                // adjust teamsList to remove those teams in playersToIgnore array
                playersToIgnore.forEach(player => {
                    const playersIndex = teamsList.indexOf(player);
                    teamsList.splice(playersIndex, 1)
                })
                // we only need to create home team schedules for displaying remaining games
                const remainingGamesSchedule = {}
                teamsList.forEach(team => {
                    // only add teams to this schedule who are playing in the league
                        remainingGamesSchedule[team] = {
                            homeGames: [...teamsList],
                        }
                        // get indexes of team in it's own schedule in order to remove
                        const homeIndexOfSelf = remainingGamesSchedule[team]['homeGames'].indexOf(team)
                        // remove teams own abbreviation from schedule
                        remainingGamesSchedule[team]['homeGames'].splice(homeIndexOfSelf, 1)
                })
                // remove opponents from each teams schedule
                duplicatesRemovedGamesPlayedArray.forEach(match => {
                    const matchup = match.split("/")
                    const [homeTeam, awayTeam] = matchup
                    const opponentsIndex = remainingGamesSchedule[`${homeTeam}`]['homeGames'].indexOf(`${awayTeam}`)
                    remainingGamesSchedule[`${homeTeam}`]['homeGames'].splice(opponentsIndex, 1)
                })
                // push remaining games into an array that can be fetched and displayed in discord channel
                for(const team in remainingGamesSchedule){
                    const teamsHomeGamesRemaining = remainingGamesSchedule[team]['homeGames'] 
                    if(teamsHomeGamesRemaining.length > 0){
                        teamsHomeGamesRemaining.forEach(opponent => {
                            const remainingGames = `${team}/${opponent}`
                            remainingMatchUps.push(remainingGames)
                        })
                    }
                }    
                let scheduleResponse = "" 
                remainingMatchUps.forEach(matchup => {
                    const [homeTeam, awayTeam] = matchup.split("/")
                    const homeCoachObject = coaches.find(coach => coach.team === homeTeam)
                    const awayCoachObject = coaches.find(coach => coach.team === awayTeam)
                    scheduleResponse += `${homeCoachObject.user} <:${homeCoachObject.emojiName}:${homeCoachObject.emojiId}> vs <:${awayCoachObject.emojiName}:${awayCoachObject.emojiId}> ${awayCoachObject.user}\n`
                })
                scheduleResponse += `\`${gamesRemainingToBePlayed}\` remaining matchups to be played`
                await channel.send(scheduleResponse)               
        }
        if(gamesRemainingToBePlayed === 0){
            await channel.send("All games complete")
        }
    } catch (error) {
        await channel.send(error.message)
    }
}

export default showRemainingGames