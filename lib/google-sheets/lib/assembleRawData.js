import sheetsGet from "./sheetsGet.js";

async function assembleRawData({sheets, spreadsheetId, range, tempCSVData}){

    const nextRowResponse = await sheetsGet({sheets, spreadsheetId, range})
    const rawDataColH =  nextRowResponse.data.values // Return the unique IDs
    const rawDataNextFreeRowNumber = rawDataColH.length + 1;

    const rawGameData = [];
    
    tempCSVData.slice(1, 62).forEach((dataSet) => {
        rawGameData.push(dataSet[1]);
    });
    
    const rawDataEntries = {
        range: `RawData!H${rawDataNextFreeRowNumber}:BP${rawDataNextFreeRowNumber}`,
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