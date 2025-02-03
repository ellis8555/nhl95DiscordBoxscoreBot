import { AttachmentBuilder } from 'discord.js';
import generateRemainingOpponentsImage from "../canvas/generateRemainingOpponentsImage.js";

async function displayRemainingOpponents(q_seasonGamesChannelId, {client, teamAbbreviation, teamCodes, coaches, uniqueIdsFile}){
    const channel = client.channels.cache.get(q_seasonGamesChannelId)
    
    // return if the 3 letters don't represent a team
    if(!teamCodes.includes(teamAbbreviation)){
        await channel.send("Teams abbreviation not found")
        return;
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
        if(opponenetsPlayedCount[team] < 4){
            sortedGamesPlayed[team] = opponenetsPlayedCount[team]
        }
    })

    for(const opponent of Object.entries(opponenetsPlayedCount)){
        // search for opponents who have played all games
        if(opponent[1] === 4){
            const opponentPosition = teamCodes.indexOf(opponent[0])
            teamCodes.splice(opponentPosition, 1)
        }
    } 

    // return logos of opponents remaining
    if(teamCodes.length > 0){
        // remove calling teams name from teamCodes
        const callingTeamsIndex = teamCodes.indexOf(teamAbbreviation);
        teamCodes.splice(callingTeamsIndex, 1)
        // get the image created
        const remainingOpponentsImage = await generateRemainingOpponentsImage({teamCodes})
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
        // send list of teams where some games played
        if(Object.keys(sortedGamesPlayed).length > 0){
            let partialGamesPlayedList = "\`Partial games remaining\`\n"
            for(let team in sortedGamesPlayed){
                partialGamesPlayedList += `${team} - ${sortedGamesPlayed[team]}\n`
            }
            await channel.send(partialGamesPlayedList)
        }
    } else {
        await channel.send("Your season is complete")
    }
    
}

export default displayRemainingOpponents