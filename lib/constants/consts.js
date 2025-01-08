export const bot_consts = {
    token : `${process.env.token}`, // token or dev-token
    uniqueIdsFileName: `${process.env.uniqueIdsFileName}`, // the test for duplicates/invalid states
    server: `${process.env.server}`,
    listeningChannel: "admin-boxscores", // name of the channel in which to listen for game states to be uploaded
    outputChannel: "2007-season-boxscores",
    saveStatePattern: /^W12.*\.state\d{1,3}$/, // pattern for the saved state
    sendResponseToOutputchannel: true,
    allowDuplicates: true,
    writeToUniqueIdsFile: false,
    writeToGoogleSheets: true,
    sendBoxscore: false,
    leagueName: "w",
    seasonNum: "12",
    appendGoogleSheets: {
        // this counts how many rows there currently are. used for finding next free row position
        countRowRange: "H:H",
        // raw<Value> are column ranges for each of the 4 tabs in the sheets
        rawData: {
            col_start: "H",
            col_end: "BP"
        },
        rawPlayer: {
            col_start: "F",
            col_end: "U"
        },
        rawPenalty: {
            col_start: "F",
            col_end: "L"
        },
        rawScoring: {
            col_start: "F",
            col_end: "U"
        }
    },
};