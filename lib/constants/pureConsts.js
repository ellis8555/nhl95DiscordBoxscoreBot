export const pure_consts = {
    uniqueIdsFileName: `${process.env.pureUniqueIdsFileName}`, // the test for duplicates/invalid states
    pureServer: `${process.env.pureServer}`,
    listeningChannel: "pure-scores", // name of the channel in which to listen for game states to be uploaded
    pureLeagueScoreExpression: /^\s*(?:EDIT\s+)?[a-zA-Z]{3}\s+(\d+)\s*-\s+[a-zA-Z]{3}\s+(\d+)\s*$/,
    editPermission: {
        ticklepuss: "582240735793774618",
    },
    writeToGoogleSheets: true,
    currentSeason: "9",
    appendGoogleSheets: {
        // this is range to begin searching for matching home/away teams to find row number for updating
        countRowRange: "A2:L",
        rawSchedule: {
            // check for blank entry
            col_start_search: "J",
            col_end_search: "K",
            // update proper columns for a game entry
            col_start_home: "J", // home result
            col_end_home: "K", // home score
            col_start_away: "M",    // away result
            col_end_away: "N" // away score
        }
    },
    teamCodesList : [
        "ANA",
        "BOS",
        "BUF",
        "CAL",
        "CHI",
        "DAL",
        "DET",
        "EDM",
        "FLA",
        "HFD",
        "LAK",
        "MTL",
        "NJD",
        "NYI",
        "NYR",
        "OTT",
        "PHL",
        "PIT",
        "QUE",
        "SJS",
        "STL",
        "TBL",
        "TOR",
        "VAN",
        "WAW",
        "WPG",
    ]
};