async function mentionRemainingOpponents(seasonGamesChannelId, {client, coachId, teamCodes, userMessage, coaches, uniqueIdsFile}){
    const channel = client.channels.cache.get(seasonGamesChannelId)

    // get coaches team abbreviation
    const coachObject = coaches.find(coach => coach.id === coachId)

    if(!coachObject) return;
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
        if(opponent[1] === 4){
            const opponentPosition = teamCodes.indexOf(opponent[0])
            teamCodes.splice(opponentPosition, 1)
        }
    }  

    if(teamCodes.length > 0){
        let seasonGamesCall = ""
        teamCodes.forEach(opponent => {
            const coachObject = coaches.find(coach => coach.team === opponent)
            if(coachObject.id !== coachId){
                seasonGamesCall += `<@${coachObject.id}>`
            }
        })

        // if exists get time requested for games
        const messageParts = userMessage.split(" ")
        let timePortion;
        if(messageParts.length === 3){
            timePortion = messageParts[2]
        }
        seasonGamesCall += `\nGames vs ${coachName} ${timePortion ?  timePortion + " or later": ""}?`
        await channel.send(seasonGamesCall)
    } else {
        await channel.send("Your season is complete")
    }
}

export default mentionRemainingOpponents