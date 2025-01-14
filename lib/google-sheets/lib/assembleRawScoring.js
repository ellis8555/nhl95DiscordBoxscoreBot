import sheetsGet from "./sheetsGet.js"
import { bot_consts } from "../../constants/consts.js";

const { col_start, col_end } = bot_consts.appendGoogleSheets.rawScoring;

async function assembleRawScoring({sheets, spreadsheetId, range, nextGameId, romData}){

    const { allGoalsScored } = romData.data
    const rawScoringData = [];
    const rawScoringNextRowResponse = await await sheetsGet({sheets, spreadsheetId, range}) 
    const rawScoringColH =  rawScoringNextRowResponse.data.values || [] // Return the unique IDs
    const rawScoringNextFreeRowNumber = rawScoringColH.length + 1;

    allGoalsScored.forEach(goal => {
    const tempArray = [nextGameId];
    for (let goalStat in goal){
        tempArray.push(goal[goalStat])
    }
    rawScoringData.push(tempArray)
    })
    const rawScoringEntries = {
    range: `RawScoring!${col_start}${rawScoringNextFreeRowNumber}:${col_end}${rawScoringNextFreeRowNumber + rawScoringData.length-1}`,
    resource: {
        values: [...rawScoringData]
    }
    }

    return { rawScoringEntries }
}

export default assembleRawScoring;