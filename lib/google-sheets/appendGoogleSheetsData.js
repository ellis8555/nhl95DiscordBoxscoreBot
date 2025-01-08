import getNextGameId from "./lib/getNextGameId.js";
import assembleRawData from "./lib/assembleRawData.js";
import assembleRawPlayer from './lib/assembleRawPlayer.js'
import assembleRawPenalty from "./lib/assembleRawPenalty.js";
import assembleRawScoring from "./lib/assembleRawScoring.js";
import { bot_consts } from "../constants/consts.js";

const { countRowRange } = bot_consts.appendGoogleSheets;


async function appendGoogleSheetsData({sheets, spreadsheetId, romData}) {

    try {
    let range;
    let nextGameId;
    const sheetEntries = [];

    ////////////////////
    // begin RawData tab 
    ////////////////////

    try {     
        // get how many rows down new data to be appended
        range = `RawData!${countRowRange}`;

        const {
            rawDataEntries,
            rawDataNextFreeRowNumber
        } = await assembleRawData({sheets, spreadsheetId, range, romData})

        
        // get the most recent game_id used to place into other tabs within the table which need the game id
        range = `RawData!A${rawDataNextFreeRowNumber}:A${rawDataNextFreeRowNumber}`;
        nextGameId = await getNextGameId({sheets, spreadsheetId, range})
        // TODO:
        sheetEntries.push(rawDataEntries)
    } catch (error) {
        throw new Error("Error in processing the RawData tab in sheets")
    }

    //////////////////////
    // begin rawPlayer tab
    //////////////////////

    try {      
        // get how many rows down new data to be appended
        range = `RawPlayer!${countRowRange}`;
    
        const { rawPlayerEntries } = await assembleRawPlayer({
            sheets,
            spreadsheetId,
            range,
            nextGameId,
            romData
        })
    
        // TODO:
        sheetEntries.push(rawPlayerEntries)
    } catch (error) {
        throw new Error("Error in processing the RawPlayer tab in sheets")
    }

    ///////////////////
    // begin rawPenalty
    ///////////////////

try {    
    // get how many rows down new data to be appended
    range = `RawPenalty!${countRowRange}`;

    const { rawPenaltyEntries } = await assembleRawPenalty({
        sheets,
        spreadsheetId,
        range,
        nextGameId,
        romData
    })

    // TODO:
    sheetEntries.push(rawPenaltyEntries)
} catch (error) {
    throw new Error("Error in processing the RawPentalty tab in sheets")
}

    ////////////////////
    // begin rawScoring
    ////////////////////

    try {      
        // get how many rows down new data to be appended
        range = `RawScoring!${countRowRange}`;
    
        const { rawScoringEntries } = await assembleRawScoring({
            sheets,
            spreadsheetId,
            range,
            nextGameId,
            romData
        })
    
        // TODO:
        sheetEntries.push(rawScoringEntries)
    } catch (error) {
        throw new Error("Error in processing the RawScoring tab in sheets")
    }

    /////////////////////////////////////
    // send all requests to google sheets
    /////////////////////////////////////

// Use for ... of loop for async/await
for (const entry of sheetEntries) {
    const { range, resource } = entry;
    await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    resource,
    });
}
} catch (error) {
    return {status: "error", message: error.message}
}
}

export default appendGoogleSheetsData;