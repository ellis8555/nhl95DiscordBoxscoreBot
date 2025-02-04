export const pure_consts = {
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
    ],
    coaches: [
          {
            "id": "694688440440193186",
            "user": "shawnbell_",
            "team": "NYI"
          },
          {
            "id": "144973906070077440",
            "user": "segathon",
            "team": "PIT"
          },
          {
            "id": "582240735793774618",
            "user": "Puss",
            "team": "MTL"
          },
          {
            "id": "1211045587483623484",
            "user": "Krav",
            "team": "VAN"
          },
          {
            "id": "874726051790594051",
            "user": "Nips",
            "team": "SJS"
          },
          {
            "id": "1211045587483623484",
            "user": "MNYoda",
            "team": "PHL"
          },
          {
            "id": "1009697012737921055",
            "user": "MNYoda",
            "team": "PHL"
          },
          {
            "id": "802225742523531325",
            "user": "Nathan",
            "team": "WPG"
          },
          {
            "id": "1042251245609549824",
            "user": "MarylandMike",
            "team": "FLA"
          },
          {
            "id": "373576219129806859",
            "user": "MikeVick",
            "team": "LAK"
          }
    ]
};