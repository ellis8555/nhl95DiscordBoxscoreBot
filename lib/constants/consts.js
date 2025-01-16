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
    writeToGoogleSheets: false,
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
            col_start: "G",
            col_end: "L"
        },
        rawScoring: {
            col_start: "G",
            col_end: "N"
        }
    },
    teamCodes: {0:'AHC', 1:'AUT', 2:'BAY', 3:'BBM', 4:'BFC', 5:'HAM', 6:'HIG', 7:'HOT', 8:'ING', 9:'IFV', 10:'KVK', 11:'MHT', 12:'MGG', 13:'NBK', 14:'OCW', 15:'PIT', 16:'PRO', 17:'RIC', 18:'SAG', 19:'SOV', 20:'SHS', 21:'SVF', 22:'SUM', 23:'SUN', 24:'TAI', 25:'TEG', 26:'TBP', 27:'VHV', 28:'WDY'}
};