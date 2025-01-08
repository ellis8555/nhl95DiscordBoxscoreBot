import sheetsGet from "./sheetsGet.js";

async function getNextGameId({sheets, spreadsheetId, range}){

    const nextGameIdResponse = await sheetsGet({sheets, spreadsheetId, range})
    const nextGameId = nextGameIdResponse.data.values.flat()[0];
    return nextGameId

}

export default getNextGameId;