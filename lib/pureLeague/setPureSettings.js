import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {pure_consts} from "../constants/consts.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// dynamic import for cross-platform safety

let {
    currentSeason,
    seasonGamesChannel,
    listeningChannel,
    writeToGoogleSheets,
    teamCodesList
} = pure_consts

const { channelsRange, coachesStartRange, coachesEndRange, bsbSheetName, coachesEndColumn } = pure_consts.appendGoogleSheets.bsbSettings

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

        const spreadsheetId = process.env.pureLeagueSpreadSheetId;

        // get end range of coaches list
        const range = `${bsbSheetName}!${coachesEndRange}`
        let updateCoachesEndRange = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        })
        const { values } = updateCoachesEndRange.data
        updateCoachesEndRange = values.flat()[0]

        // ranges for all settings
        let ranges = [
            `${bsbSheetName}!${channelsRange}`,
            `${bsbSheetName}!${coachesStartRange}:${coachesEndColumn}${updateCoachesEndRange}`
        ]

        const res = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
        })

        if(res.status !== 200 || res.statusText !== "OK"){
            throw new Error("Error in reading BSB settings sheet")
        }

        // read in previous settings from file
        const filePath = path.join(__dirname,"..", "..", "public", "json", "pure_bot_constants.json")
        const file = readFileSync(filePath, "utf-8")
        const pureSettings = JSON.parse(file)

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
            // ensure team abbreviations match teams array
            const upperCaseTeam = team.toUpperCase()
            const doesTeamExist = teamCodesList.includes(upperCaseTeam)
            // get coach's current available status
            const getCoachObject = pureSettings.coaches.find(prevCoach => prevCoach.id === discordId)
            const skipMention = getCoachObject?.skipBeingMentioned ?? false
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
                skipBeingMentioned : skipMention
            }
            updatedCoaches.push(coachObj)
        })
        
        pureSettings.currentSeason = currentSeason
        pureSettings.seasonGamesChannel = seasonGamesChannel
        pureSettings.listeningChannel = listeningChannel
        pureSettings.writeToGoogleSheets = writeToGoogleSheets
        pureSettings.coaches = updatedCoaches
        // rewrite pure_bot_constants.json
        writeFileSync(filePath, JSON.stringify(pureSettings, null, 2), "utf-8")
        await message.channel.send("Settings have been updated")
    } catch (error) {
        // ignore coachObj is not defined (sheet overextends)
        if(error.message !== "coachObj is not defined"){
            await message.channel.send(error.message)
        }
    }
}

export default setPureSettings
