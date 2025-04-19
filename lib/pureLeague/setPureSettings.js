import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path";
import { pure_consts } from "../constants/consts.js";

let {
    currentSeason,
    seasonGamesChannel,
    listeningChannel,
    coaches,
} = pure_consts

const { channelsRange, coachesRange } = pure_consts.appendGoogleSheets.bsbSettings

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
            `BSB Settings!${channelsRange}`,
            `BSB Settings!${coachesRange}`
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

        // begin setting coach details
        coaches = []
        coachDetails.values.forEach(coach => {
            const [discordName, discordId, team, sheetsName] = coach
            const coachObj = {
                id : discordId,
                user : discordName,
                team : team,
                sheetsUser : sheetsName,
                emojiName : "",
                emojiId : "",
                skipBeingMentioned : false
            }
            if(coachObj){
                coaches.push(coachObj)
            }
        })

        // rewrite pure_bot_constants.json
        const filePath = join(process.cwd(), "public", "json", "pure_bot_constants.json")
        const file = readFileSync(filePath, "utf-8")
        const pureSettings = JSON.parse(file)
        
        pureSettings.currentSeason = currentSeason
        pureSettings.seasonGamesChannel = seasonGamesChannel
        pureSettings.listeningChannel = listeningChannel
        pureSettings.coaches = coaches
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