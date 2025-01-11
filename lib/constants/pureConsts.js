export const pure_consts = {
    uniqueIdsFileName: `${process.env.pureUniqueIdsFileName}`, // the test for duplicates/invalid states
    pureServer: `${process.env.pureServer}`,
    listeningChannel: "pure-scores", // name of the channel in which to listen for game states to be uploaded
    pureLeagueScoreExpression: /^\s*[a-zA-Z]{3}\s+[0-4]?[0-9]\s+-\s+[a-zA-Z]{3}\s+[0-4]?[0-9]\s*$/,
    writeToUniqueIdsFile: false,
    writeToGoogleSheets: false,
    currentSeason: "9",
    appendGoogleSheets: {
        // this counts how many rows there currently are. used for finding next free row position
        countRowRange: "A2:L",
        // raw<Value> are column ranges for each of the 4 tabs in the sheets
        rawSchedule: {
            col_start: "J",
            col_end: "K"
        }
    },
    teamCodesList : [
        "ANH",
        "BOS",
        "BUF",
        "CGY",
        "CHI",
        "DAL",
        "DET",
        "EDM",
        "FLA",
        "HFD",
        "LA",
        "MTL",
        "NJ",
        "NYI",
        "NYR",
        "OTW",
        "PHI",
        "PIT",
        "QUE",
        "SJ",
        "STL",
        "TB",
        "TOR",
        "VAN",
        "WSH",
        "WPG",
        "ASE",
        "ASW"
    ]
};