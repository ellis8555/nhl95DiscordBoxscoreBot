import { logging } from "googleapis/build/src/apis/logging/index.js";

async function mentionRemainingOpponents(seasonGamesChannelId, excludeCoaches = [], {server, client, coachId, teamCodes, messageId, userMessage, coaches, uniqueIdsFile}){
    const channel = client.channels.cache.get(seasonGamesChannelId)
    // get coaches team abbreviation
    const coachObject = coaches.find(coach => coach.id === coachId)
    if(!coachObject) return;

    const w_server = process.env.server
    const q_server = process.env.qServer
    const pureServer = process.env.pureServer
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
    if(server === pureServer){
        const { pure_consts } = await import("../constants/consts.js")
        // get games required vs each opponent
        gamesVsEachOpponent = pure_consts.p_games_vs_opponents
    }

    const coachName = coachObject.user
    const teamAbbreviation = coachObject.team

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

    // 
    for(const opponent of Object.entries(opponenetsPlayedCount)){
        // search for opponents who have played all games
        if(opponent[1] === gamesVsEachOpponent){
            const opponentPosition = teamCodes.indexOf(opponent[0])
            teamCodes.splice(opponentPosition, 1)
        }
    }  

    // if season is complete coaches team is still in the array so length of 1
    // unless pure league which the teamsList is 26 original ROM teams
    let leaguesTeamCodesFloor
    if(server === w_server || server === q_server){
        leaguesTeamCodesFloor = 1
    } else if(server === pureServer){
        leaguesTeamCodesFloor = (26 - coaches.length) + 1
    } else {
        leaguesTeamCodesFloor = 1 
    }
    if(teamCodes.length > leaguesTeamCodesFloor){
        // remove coaches from being mentioned who are no longer available to play games
        if( excludeCoaches.length > 0){
            excludeCoaches.forEach(team => {
                const teamToExclude = teamCodes.indexOf(team)
                if(teamToExclude !== -1){
                    teamCodes.splice(teamToExclude, 1)
                }
            })
        }
        
        let seasonGamesCall = ""
        teamCodes.forEach(opponent => {
            const coachObject = coaches.find(coach => coach.team === opponent)
            // check for coachObject required as some leagues have teamCodes that are not played by a coach
            if(coachObject && coachObject.id !== coachId){
                coachObject.skipBeingMentioned === false ? seasonGamesCall += `<@${coachObject.id}>` : seasonGamesCall += `@${coachObject.user}`
            }
        })

        // add coaches team logo for 'W' and 'Q' leagues but not 'Pure' league
        if(server !== pureServer){
            seasonGamesCall += `\n<:${coachObject.emojiName}:${coachObject.emojiId}>`
        }
        // add champs custom call
        const champCoachObject = coaches.find(coachObject => coachObject.team === "SUM")
        // jeelocks custom request message
        const jeelockObject = coaches.find(coachObject => coachObject.team === 'SAG')
        let isRequestByJeelockExtended = false
        let timePortion;
        const messageParts = userMessage.split(" ")
        if(champCoachObject && coachId === champCoachObject.id){
            seasonGamesCall += `\n :trophy: Games vs ${coachName} :trophy:`
        } else if(jeelockObject && coachId === jeelockObject.id){
            let jeesCustomMessage;
            if(messageParts.length > 2){
                messageParts.splice(0,2)
                jeesCustomMessage = messageParts.reduce((prev, curr) => {
                    return prev + " " + curr
                })
                isRequestByJeelockExtended = true
            }
            seasonGamesCall += `\nGames vs ${coachName} ${jeesCustomMessage ?  jeesCustomMessage : ""}?`
        } else {
            // if exists get time requested for games
            if(messageParts.length === 3){
                timePortion = messageParts[2]
            }
            seasonGamesCall += `\nGames vs ${coachName} ${timePortion ?  timePortion + " or later": ""}?`
        }
        if(isRequestByJeelockExtended){
            const jeesMessage = await channel.messages.fetch(messageId)
            await jeesMessage.delete()           
        }
        await channel.send(seasonGamesCall)
    } else {
        if(server === w_server || server === q_server){
            await channel.send(`<:${coachObject.emojiName}:${coachObject.emojiId}>\n${teamAbbreviation} season is complete`)
        }
        if(server === pureServer){
            await channel.send(`${coachName} season is complete`)
        }
    }
}

export default mentionRemainingOpponents