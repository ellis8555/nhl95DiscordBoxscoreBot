export const pure_consts = {
    pureServer: `${process.env.pureServer}`,
    listeningChannel: "pure-scores", // name of the channel in which to listen for game states to be uploaded
    pureLeagueScoreExpression: /^\s*(?:EDIT\s+)?[a-zA-Z]{3}\s+(\d+)\s*-\s+[a-zA-Z]{3}\s+(\d+)\s*$/,
    editPermission: {
        ticklepuss: "582240735793774618",
    },
    writeToGoogleSheets: false,
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
        "WAS",
        "WPG",
    ],
    coaches: [
          {
            "id": "694688440440193186",
            "user": "shawnbell_",
            "team": "NYI",
            "sheetsUser": "ShawnBell",
            "streak": "-"
          },
          {
            "id": "144973906070077440",
            "user": "segathon",
            "team": "PIT",
            "sheetsUser": "Segathon",
            "streak": "-"
          },
          {
            "id": "582240735793774618",
            "user": "Puss",
            "team": "WAS",
            "sheetsUser": "Puss",
            "streak": "-"
          },
          {
            "id": "1211045587483623484",
            "user": "Krav",
            "team": "VAN",
            "sheetsUser": "Krav",
            "streak": "-"
          },
          {
            "id": "874726051790594051",
            "user": "Nips",
            "team": "SJS",
            "sheetsUser": "Nips",
            "streak": "-"
          },
          {
            "id": "1009697012737921055",
            "user": "MNYoda",
            "team": "PHL",
            "streak": "-"
          },
          {
            "id": "802225742523531325",
            "user": "Nathan",
            "team": "CHI",
            "sheetsUser": "Nathan",
            "streak": "-"
          },
          {
            "id": "1042251245609549824",
            "user": "MarylandMike",
            "team": "FLA",
            "sheetsUser": "MarylandMike",
            "streak": "-"
          },
          {
            "id": "373576219129806859",
            "user": "MikeVick",
            "team": "LAK",
            "sheetsUser": "MikeVick",
            "streak": "-"
          }
    ]
};