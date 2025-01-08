import sheetsGet from "./sheetsGet.js"

async function assembleRawPenalty({sheets, spreadsheetId, range, nextGameId, romData}){

    const { allPenalties } = romData.data
    const rawPenaltyData = [];

    const rawPenaltyNextRowResponse = await await sheetsGet({sheets, spreadsheetId, range}) 
    const rawPenaltyColH =  rawPenaltyNextRowResponse.data.values || [] // Return the unique IDs
    const rawPenaltyNextFreeRowNumber = rawPenaltyColH.length + 1;

    allPenalties.forEach(penalty => {
    const tempArray = [nextGameId];
    for (let penaltyStat in penalty){
        tempArray.push(penalty[penaltyStat])
    }
    rawPenaltyData.push(tempArray)
    })

    const rawPenaltyEntries = {
    range: `RawPenalty!F${rawPenaltyNextFreeRowNumber}:L${rawPenaltyNextFreeRowNumber + rawPenaltyData.length-1}`,
    resource: {
        values: [...rawPenaltyData]
    }
    }

    return {
        rawPenaltyEntries
    }

}

export default assembleRawPenalty;