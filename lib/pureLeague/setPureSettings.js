import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path";
import { pure_consts } from "../constants/consts.js";

let {
    currentSeason,
    seasonGamesChannel,
    listeningChannel,
    writeToGoogleSheets,
    coaches,
    teamCodesList
} = pure_consts

const { channelsRange, coachesRange, bsbSheetName } = pure_consts.appendGoogleSheets.bsbSettings

async function setPureSettings({sheets, message}){
    let pureScoreChannelId 

    try {
        // get channel bot is listening to in pure league
        const channel = message.guild.channels.cache.find(channel => channel.name === listeningChannel)

        if(channel){
            pureScoreChannelId = channel.id;
            if (message.channel.id !== pureScoreChannelId) return; 
        } else {
            throw new Error(`Channel ${listeningChannel} not found within trying to set new settings. Shit's about to hit the fan!`)
        }

        const spreadsheetId = process.env.pureLeagueSpreadSheetId; // begin reading the sheet
        let ranges = [
            `${bsbSheetName}!${channelsRange}`,
            `${bsbSheetName}!${coachesRange}`
        ]
    
        const res = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
        })

        if(res.status !== 200 || res.statusText !== "OK"){
            throw new Error("Error in reading BSB settings sheet")
        }

        const [channelSettings, coachDetails] = res.data.valueRanges

        // get and set channel settings from sheets
        const channelSettingsData = Object.fromEntries(channelSettings.values)
        currentSeason = channelSettingsData['Season Number']
        seasonGamesChannel = channelSettingsData['Season Games Channel']
        listeningChannel = channelSettingsData['Submit Score Channel']
        writeToGoogleSheets = JSON.parse(channelSettingsData['Write to Google sheets'].toLowerCase())

        // begin setting coach details
        const updatedCoaches = []
        coachDetails.values.forEach(coach => {
            let [discordName, discordId, team, sheetsName] = coach
            // used to keep skipBeingMentioned status from being changed
            const searchForCoach = coaches.find(prevCoach => prevCoach.id === discordId)
            // ensure team abbreviations match teams array
            const upperCaseTeam = team.toUpperCase()
            const doesTeamExist = teamCodesList.includes(upperCaseTeam)
            if(!doesTeamExist){
                throw new Error(`${team} is not found in list of team abbreviations`)
            }
            const coachObj = {
                id : discordId,
                user : discordName,
                team : upperCaseTeam,
                sheetsUser : sheetsName,
                emojiName : "",
                emojiId : "",
                skipBeingMentioned : searchForCoach.skipBeingMentioned ?? false
            }
            if(coachObj){
                updatedCoaches.push(coachObj)
            }
        })

        // rewrite pure_bot_constants.json
        const filePath = join(process.cwd(), "public", "json", "pure_bot_constants.json")
        const file = readFileSync(filePath, "utf-8")
        const pureSettings = JSON.parse(file)
        
        pureSettings.currentSeason = currentSeason
        pureSettings.seasonGamesChannel = seasonGamesChannel
        pureSettings.listeningChannel = listeningChannel
        pureSettings.writeToGoogleSheets = writeToGoogleSheets
        pureSettings.coaches = updatedCoaches
        writeFileSync(filePath, JSON.stringify(pureSettings, null, 2), "utf-8")
    } catch (error) {
        // the range for coaches to look for in the sheets overextends so there is a error
        // ignore sending that message otherwise send discord message
        if(error.message !== "coachObj is not defined"){
            await message.channel.send(error.message)
        }
    }
}

export default setPureSettings