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
    seasonNum: "12"
};