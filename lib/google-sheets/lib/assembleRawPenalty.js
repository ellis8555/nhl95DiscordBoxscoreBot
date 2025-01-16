import sheetsGet from "./sheetsGet.js"
import { bot_consts } from "../../constants/consts.js";

const { col_start, col_end } = bot_consts.appendGoogleSheets.rawPenalty;

async function assembleRawPenalty({sheets, spreadsheetId, range, romData}){

    const { allPenalties } = romData.data
    const rawPenaltyData = [];

    const rawPenaltyNextRowResponse = await await sheetsGet({sheets, spreadsheetId, range}) 
    const rawPenaltyColH =  rawPenaltyNextRowResponse.data.values || [] // Return the unique IDs
    const rawPenaltyNextFreeRowNumber = rawPenaltyColH.length + 1;

    allPenalties.forEach(penalty => {
    const tempArray = [];
    for (let penaltyStat in penalty){
        tempArray.push(penalty[penaltyStat])
    }
    rawPenaltyData.push(tempArray)
    })

    const rawPenaltyEntries = {
    range: `RawPenalty!${col_start}${rawPenaltyNextFreeRowNumber}:${col_end}${rawPenaltyNextFreeRowNumber + rawPenaltyData.length-1}`,
    resource: {
        values: [...rawPenaltyData]
    }
    }

    return {
        rawPenaltyEntries
    }

}

export default assembleRawPenalty;