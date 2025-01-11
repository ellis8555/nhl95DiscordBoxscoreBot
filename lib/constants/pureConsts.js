export const pure_consts = {
    uniqueIdsFileName: `${process.env.pureUniqueIdsFileName}`, // the test for duplicates/invalid states
    pureServer: `${process.env.pureServer}`,
    listeningChannel: "pure-scores", // name of the channel in which to listen for game states to be uploaded
    pureLeagueScoreExpression: /^\s*[A-Z]{3}\s+[0-4]?[0-9]\s+-\s+[A-Z]{3}\s+[0-4]?[0-9]\s*$/,
    writeToUniqueIdsFile: false,
    writeToGoogleSheets: false,
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