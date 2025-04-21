import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path";
import { bot_consts } from "../constants/consts.js";

const { channelsRange, coachesStartRange, coachesEndRange, bsbSheetName, romTeamOrderList, coachesEndColumn } = bot_consts.appendGoogleSheets.bsbSettings

async function editLeagueSettings({sheets}){
    try {
        const spreadsheetId = process.env.spreadSheetId;

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
            `${bsbSheetName}!${romTeamOrderList}`,
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

        // begin reading in from the updated file
        const filePath = join(process.cwd(), "public", "json", "bot_constants.json")
        const file = readFileSync(filePath, "utf-8")
        const w_settings = JSON.parse(file);

        let [romTeamOrder, channelSettings, coachDetails] = res.data.valueRanges
        // update roms team order list to match that of .py file
        romTeamOrder = romTeamOrder.values[0][0]
        const teamsPattern = /([A-Z]{3})/g
        const teamsAbbreviations = romTeamOrder.match(teamsPattern)
        // update various channel settings
        channelSettings = Object.fromEntries(channelSettings.values)
        // update coach objects to reflect new season
        coachDetails = coachDetails.values
        // begin setting coach details
        const updatedCoaches = []
        coachDetails.forEach(coach => {
            let [discordName, discordId, team, emojiId, emojiName] = coach
            // ensure team abbreviations match teams array
            const upperCaseTeam = team.toUpperCase()
            const doesTeamExist = teamsAbbreviations.includes(upperCaseTeam)
            // get coach's current avaialbe status
            const getCoachObject = w_settings.coaches.find(prevCoach => prevCoach.id === discordId)
            if(!doesTeamExist){
                throw new Error(`${team} is not found in list of team abbreviations from .py file listing`)
            }
            const coachObj = {
                id : discordId,
                user : discordName,
                team : upperCaseTeam,
                emojiId : emojiId,
                emojiName : emojiName,
                skipBeingMentioned : getCoachObject?.skipBeingMentioned ?? false
            }
            if(coachObj){
                updatedCoaches.push(coachObj)
            }
        })

        // update various settings
        w_settings.saveStatesListeningChannel = channelSettings['Save states channel']
        w_settings.boxscoreOutputChannel = channelSettings['Boxscore channel']
        w_settings.seasonGamesChannel= channelSettings['Season games channel']
        w_settings.saveStatePattern = `^${channelSettings['ROM save state name']}.*\\.state\\d{1,3}$`
        w_settings.seasonNum = channelSettings['Season number']
        w_settings.teamCodes = teamsAbbreviations
        w_settings.coaches = updatedCoaches
        // write to file the updated settings
        writeFileSync(filePath, JSON.stringify(w_settings, null, 2), "utf-8")
        return 'Leauge settings have been adjusted'
    } catch (error) {
         return error.message   
    }
}

export default editLeagueSettings