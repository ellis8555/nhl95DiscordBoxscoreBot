import sheetsGet from "./sheetsGet.js";
import { bot_consts } from "../../constants/consts.js";

const { col_start, col_end } = bot_consts.appendGoogleSheets.rawData;

async function assembleRawData({sheets, spreadsheetId, range, romData}){

    const { tempCSVData } = romData;

    const nextRowResponse = await sheetsGet({sheets, spreadsheetId, range})
    const rawDataColH =  nextRowResponse.data.values // Return the unique IDs
    const rawDataNextFreeRowNumber = rawDataColH.length + 1;

    const rawGameData = [];
    
    tempCSVData.slice(1, 62).forEach((dataSet) => {
        rawGameData.push(dataSet[1]);
    });
    
    const rawDataEntries = {
        range: `RawData!${col_start}${rawDataNextFreeRowNumber}:${col_end}${rawDataNextFreeRowNumber}`,
        resource: {
            values: [rawGameData]
        }
    }

    return {
        rawDataEntries,
        rawDataNextFreeRowNumber
    }

}

export default assembleRawData;