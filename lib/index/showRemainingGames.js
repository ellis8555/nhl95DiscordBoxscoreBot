import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

async function showRemainingGames(channelId, {client, coachId, leagueName, messageContent}){
    const channel = client.channels.cache.get(channelId)
    
    let uniqueIdFileName;
    let leagueConstantsFileName;
    let leagueConstants;
    let gamesPlayedVsOpponents
    let teamsCount
    let teamsList
    let totalLeagueGamesPlayed
    let coaches
    try {
        if(leagueName === "W"){
            uniqueIdFileName = "wUniqueIds.csv"
            leagueConstantsFileName = "bot_constants.json"
            leagueConstants = await import("../constants/consts.js")
            const { bot_consts } = leagueConstants
            teamsList = bot_consts.teamCodes
            coaches = bot_consts.coaches
            gamesPlayedVsOpponents = bot_consts.w_games_vs_opponents
            teamsCount = bot_consts.teamCodes.length
            totalLeagueGamesPlayed = (teamsCount * ((teamsCount - 1) * gamesPlayedVsOpponents)) / 2
        }
    
        const uniqueIdFilePath = join(process.cwd(), "public", uniqueIdFileName)
        const gameData = readFileSync(uniqueIdFilePath, "utf-8")
        const gamesPlayedArray = gameData.match(/([A-Z]{3}\/[A-Z]{3})/g)
        // count used to determine when to begin gathering remaining games data and displaying to user
        const gamesPlayed = gamesPlayedArray.length/2
        // remove duplicates from uniqueId's
        
        
        if(gamesPlayed > 20){
            await channel.send(`There are more than 20 games still to be played`)
        }
        if(gamesPlayed < 21 && gamesPlayed !== 0){
            const constantsFilePath = join(process.cwd(), "public", "json", leagueConstantsFileName)
            const leagueConsts = readFileSync(constantsFilePath, "utf-8")
            const parsedLeagueConsts = JSON.parse(leagueConsts)

            // if SHOW GAMES command has already been used with under set games left then parse it from consts file
            // otherwise create the new array
            if(parsedLeagueConsts.remainingGames){
                let scheduleResponse = ""
                const remainingMatchups = parsedLeagueConsts.remainingGames
                remainingMatchups.forEach(matchup => {
                    const [homeTeam, awayTeam] = matchup.split("/")
                    const homeCoachObject = coaches.find(coach => coach.team === homeTeam)
                    const awayCoachObject = coaches.find(coach => coach.team === awayTeam)
                    scheduleResponse += `${homeCoachObject.user} <:${homeCoachObject.emojiName}:${homeCoachObject.emojiId}> vs <:${awayCoachObject.emojiName}:${awayCoachObject.emojiId}> ${awayCoachObject.user}\n`
                })
                await channel.send(scheduleResponse)
            } else {      
                // create array which will hold remaining matchups
                let remainingMatchUps = []
                // create array of teams to ignore due to not being able to complete a season or who aren't playing at all
                const playersToIgnore = ["KVK", "SHS", "MGG", "SUN"]
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
                const cleanedGamesPlayedArray = Array.from(new Set(gamesPlayedArray))
                cleanedGamesPlayedArray.forEach(match => {
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
                parsedLeagueConsts.remainingGames = [...remainingMatchUps]
                writeFileSync(constantsFilePath, JSON.stringify(parsedLeagueConsts, null, 2), "utf-8")

                let scheduleResponse = ""
                const remainingMatchups = parsedLeagueConsts.remainingGames
                remainingMatchups.forEach(matchup => {
                    const [homeTeam, awayTeam] = matchup.split("/")
                    const homeCoachObject = coaches.find(coach => coach.team === homeTeam)
                    const awayCoachObject = coaches.find(coach => coach.team === awayTeam)
                    scheduleResponse += `${homeCoachObject.user} <:${homeCoachObject.emojiName}:${homeCoachObject.emojiId}> vs <:${awayCoachObject.emojiName}:${awayCoachObject.emojiId}> ${awayCoachObject.user}\n`
                })
                await channel.send(scheduleResponse)               
            }
        }
        if(gamesPlayed === 0){
            await channel.send("All games complete")
        }
    } catch (error) {
        await channel.send(error.message)
    }
}

export default showRemainingGames