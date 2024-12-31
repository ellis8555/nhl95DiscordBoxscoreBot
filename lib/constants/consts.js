export const bot_consts = {
    token : `${process.env.dev_token}`, // token or dev-token
    uniqueIdsFileName: "s12UniqueIds.csv", // the test for duplicates/invalid states
    uniqueIdsFileTEST: "s12UniqueIds-TEST.csv", // testing file for duplication
    nhl95Server: "NHL95 Digital Hockey", // Ultra's discord
    testServer: "Ellis's test server",
    listeningChannel: "admin-boxscores", // name of the channel in which to listen for game states to be uploaded
    outputChannel: "2007-season-boxscores",
    saveStatePattern: /^W12.*\.state\d{1,3}$/
, // pattern for the saved state
    leagueName: "w",
    seasonNum: "12"
};