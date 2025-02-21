async function mentionRemainingOpponents(seasonGamesChannelId, {server, client, coachId, teamCodes, messageId, userMessage, coaches, uniqueIdsFile}){
    const channel = client.channels.cache.get(seasonGamesChannelId)

    // get coaches team abbreviation
    const coachObject = coaches.find(coach => coach.id === coachId)
    if(!coachObject) return;

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

    if(teamCodes.length > 0){
        // TODO: custom team removal to be removed at a future date
        const sunnyvale = teamCodes.indexOf("SUN")
        if(sunnyvale !== -1){
            teamCodes.splice(sunnyvale, 1)
        }
        let seasonGamesCall = ""
        teamCodes.forEach(opponent => {
            const coachObject = coaches.find(coach => coach.team === opponent)
            if(coachObject.id !== coachId){
                seasonGamesCall += `<@${coachObject.id}>`
            }
        })

        // add coaches team logo
        seasonGamesCall += `\n<:${coachObject.emojiName}:${coachObject.emojiId}>`
        // jeelocks custom request message
        const jeelockObject = coaches.find(coachObject => coachObject.team === 'SAG')
        let isRequestByJeelock = false
        let timePortion;
        const messageParts = userMessage.split(" ")
        if(jeelockObject && coachId === jeelockObject.id){
            let jeesCustomMessage;
            if(messageParts.length > 2){
                messageParts.splice(0,2)
                jeesCustomMessage = messageParts.reduce((prev, curr) => {
                    return prev + " " + curr
                })
            }
            seasonGamesCall += `\nGames vs ${coachName} ${jeesCustomMessage ?  jeesCustomMessage : ""}?`
            isRequestByJeelock = true
        } else {
            // if exists get time requested for games
            if(messageParts.length === 3){
                timePortion = messageParts[2]
            }
            seasonGamesCall += `\nGames vs ${coachName} ${timePortion ?  timePortion + " or later": ""}?`
        }
        if(isRequestByJeelock){
            const jeesMessage = await channel.messages.fetch(messageId)
            await jeesMessage.delete()           
        }
        await channel.send(seasonGamesCall)
    } else {
        await channel.send("Your season is complete")
    }
}

export default mentionRemainingOpponents