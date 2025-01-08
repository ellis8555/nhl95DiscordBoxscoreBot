import getNextGameId from "./lib/getNextGameId.js";
import assembleRawData from "./lib/assembleRawData.js";
import assembleRawPlayer from './lib/assembleRawPlayer.js'
import assembleRawPenalty from "./lib/assembleRawPenalty.js";
import assembleRawScoring from "./lib/assembleRawScoring.js";

async function appendGoogleSheetsData({sheets, spreadsheetId, romData}) {

let range;
const sheetEntries = [];

try {

    ////////////////////
    // begin RawData tab 
    ////////////////////

    // get how many rows down new data to be appended
    range = "RawData!H:H";

    const {
        rawDataEntries,
        rawDataNextFreeRowNumber
    } = await assembleRawData({sheets, spreadsheetId, range, romData})

    // get the most recent game_id used to place into other tabs within the table which need the game id

    range = `RawData!A${rawDataNextFreeRowNumber}:A${rawDataNextFreeRowNumber}`;
    const nextGameId = await getNextGameId({sheets, spreadsheetId, range})

    // TODO:
    sheetEntries.push(rawDataEntries)

    //////////////////////
    // begin rawPlayer tab
    //////////////////////

    // get how many rows down new data to be appended
    range = "RawPlayer!H:H";

    const { rawPlayerEntries } = await assembleRawPlayer({
        sheets,
        spreadsheetId,
        range,
        nextGameId,
        romData
    })

    // TODO:
    sheetEntries.push(rawPlayerEntries)

    ///////////////////
    // begin rawPenalty
    ///////////////////



    // get how many rows down new data to be appended
    range = "RawPenalty!H:H";

    const { rawPenaltyEntries } = await assembleRawPenalty({
        sheets,
        spreadsheetId,
        range,
        nextGameId,
        romData
    })

    // TODO:
    sheetEntries.push(rawPenaltyEntries)

    ////////////////////
    // begin rawScoring
    ////////////////////

    // get how many rows down new data to be appended
    range = "RawScoring!H:H";

    const { rawScoringEntries } = await assembleRawScoring({
        sheets,
        spreadsheetId,
        range,
        nextGameId,
        romData
    })

    // TODO:
    sheetEntries.push(rawScoringEntries)

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
    return {status: "error", message: "Failed to append to google sheets"}
}
}

export default appendGoogleSheetsData;