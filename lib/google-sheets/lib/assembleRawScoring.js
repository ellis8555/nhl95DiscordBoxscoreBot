import sheetsGet from "./sheetsGet.js"

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
    // rawScoring in last columns duplicates most of the goal summary
    const appendedDuplicateSummary = [...tempArray, ...tempArray.slice(2)] 
    rawScoringData.push(appendedDuplicateSummary)
    })
    const rawScoringEntries = {
    range: `RawScoring!F${rawScoringNextFreeRowNumber}:U${rawScoringNextFreeRowNumber + rawScoringData.length-1}`,
    resource: {
        values: [...rawScoringData]
    }
    }

    return { rawScoringEntries }
}

export default assembleRawScoring;