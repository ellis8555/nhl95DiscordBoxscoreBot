async function getSheets({sheets, spreadsheetId, range}){

    return await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        });

}

export default getSheets;