import { AttachmentBuilder } from 'discord.js';
import generateRemainingOpponentsImage from "../canvas/generateRemainingOpponentsImage.js";

async function displayRemainingOpponents(seasonGamesChannelId, excludeCoaches = [], {server, client, teamAbbreviation, teamCodes, coaches, uniqueIdsFile}){
    const channel = client.channels.cache.get(seasonGamesChannelId)

    // return if the 3 letters don't represent a team
    if(!teamCodes.includes(teamAbbreviation)){
        const listOfAbbreviationstoIgnore = [
            "ROM",
            "GDI",
            "FYI",
            "PYG"
        ]
        if(listOfAbbreviationstoIgnore.includes(teamAbbreviation)) return
        await channel.send("Teams abbreviation not found")
        return;
    }

    const w_server = process.env.server
    const q_server = process.env.qServer
    // assign games vs opponents depending on which server request comes from
    let gamesVsEachOpponent
    if(server === w_server){
        const { bot_consts } = await import("../constants/consts.js")
            // get games required vs each opponent
        gamesVsEachOpponent = bot_consts.w_games_vs_opponents
    }
    if(server === q_server){
        const { q_bot_consts } = await import("../constants/consts.js")
        // get games required vs each opponent
        gamesVsEachOpponent = q_bot_consts.q_games_vs_opponents
    }

    // array that will hold opponenets played
    const opponentsPlayed = []

    // extract list of matchups
    const matchupPattern = /^[A-Z]{3}\/[A-Z]{3}$/
    // create array of uniqueids file
    uniqueIdsFile.split(",").filter(entry => matchupPattern.test(entry)).map(matchup => {
        if(matchup.includes(teamAbbreviation)){
            const teamsMatch = matchup.split("/")
            teamsMatch.forEach(team => {
                if(team !== teamAbbreviation){
                    opponentsPlayed.push(team)
                }
            })
        }
    })

    // obect that holds count of how many games have been played vs opponent
    const opponenetsPlayedCount = {}
    opponentsPlayed.forEach(opponent => {
        if(opponenetsPlayedCount[opponent]){
            opponenetsPlayedCount[opponent] += 1
        } else {
            opponenetsPlayedCount[opponent] = 1
        }
    })
    const sortedOpponentsPlayedCount = Object.keys(opponenetsPlayedCount).sort()
    const sortedGamesPlayed = {};
    sortedOpponentsPlayedCount.forEach(team => {
        if(opponenetsPlayedCount[team] < gamesVsEachOpponent){
            sortedGamesPlayed[team] = opponenetsPlayedCount[team]
        }
    })

    for(const opponent of Object.entries(opponenetsPlayedCount)){
        // search for opponents who have played all games
        if(opponent[1] === gamesVsEachOpponent){
            const opponentPosition = teamCodes.indexOf(opponent[0])
            teamCodes.splice(opponentPosition, 1)
        }
    } 

    // return logos of opponents remaining
    // if season is complete coaches team is still in the array so length of 1
    if(teamCodes.length > 1){
        // remove coaches from being mentioned who are no longer available to play games
        if( excludeCoaches.length > 0){
            excludeCoaches.forEach(team => {
                const teamToExclude = teamCodes.indexOf(team)
                if(teamToExclude !== -1){
                    teamCodes.splice(teamToExclude, 1)
                }
            })
        }
        // remove calling teams name from teamCodes
        const callingTeamsIndex = teamCodes.indexOf(teamAbbreviation);
        teamCodes.splice(callingTeamsIndex, 1)
        // create how many games remaining in season
        const fullSeriesGamesRemainingTotal = teamCodes.length * gamesVsEachOpponent;
        const partialSeriesGamesTotal = Object.values(sortedGamesPlayed).reduce((prev, curr) => {
            return prev + curr
        }, 0)
        const gamesRemaining = fullSeriesGamesRemainingTotal - partialSeriesGamesTotal
        // get the image created
        const remainingOpponentsImage = await generateRemainingOpponentsImage({gamesVsEachOpponent, teamCodes, sortedGamesPlayed})
        // process returned image
        const imageBuffer = Buffer.from(remainingOpponentsImage);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'opponents.png' });

        // get coaches name to comment who the opponents are for
        const getCoach = coaches.find(coach => coach.team === teamAbbreviation)
        const coachName = getCoach.user
        // send the image to discord
        await channel.send({ 
            content: `\`${coachName} remaining opponents\``,
            files: [attachment] 
        });
        // finally send total games remaining in season for this team
        await channel.send(`\`Games remaining: ${gamesRemaining}\``)
    } else {
        const getCoach = coaches.find(coach => coach.team === teamAbbreviation)
        await channel.send(`<:${getCoach.emojiName}:${getCoach.emojiId}>\n${teamAbbreviation} season is complete.`)
    }   
} 

export default displayRemainingOpponents