///////////////////////////////////////
// List of other game stats
// 1. total faceoffs
// 2. unique id for the game state
// 3. season number
// 4. game type (season, playoff)
// 5. did game go to overtime
// 6. get the winning team
// 7. get the losing team
// 8. get home team points
// 9. get away team points
// 10. get name of league this game state is for
// 11. get the length of game used to determine if file is a complete game.
// 12. determine who the home team is
// 13. determine who the away team is
// 14. determine which team is losing team in an overtime game
// 15. get current timestamp
///////////////////////////////////////

import createGamesUniqueId from "./sub-helper-methods/create-games-unique-id.js";
import didGameGotoOvertime from "./sub-helper-methods/did-game-goto-overtime.js";
import determineWinningTeam from "./sub-helper-methods/determine-winning-team.js";
import determineLosingTeam from "./sub-helper-methods/determine-losing-team.js";
import determineHomeTeamPoints from "./sub-helper-methods/determine-home-team-points.js";
import determineAwayTeamPoints from "./sub-helper-methods/determine-away-team-points.js";

function extractOtherGameStats(gameData, seasonNumber, gameType, leagueName) {
  let otherStatDetails = {};

  // total face offs
  otherStatDetails["faceOffs"] = gameData[59][1];

  // create unique id
  otherStatDetails["uniqueGameId"] = createGamesUniqueId(
    gameData,
    seasonNumber
  );

  // add the season number
  otherStatDetails["seasonNumber"] = seasonNumber;

  // add type of game
  otherStatDetails["gameType"] = gameType;

  // determine if the game went to overtime
  const gameLength = gameData[61][1];
  otherStatDetails["overtimeRequired"] = didGameGotoOvertime(gameLength);
  const wasOvertimeRequired = otherStatDetails["overtimeRequired"];

  // determine winning team
  otherStatDetails["winningTeam"] = determineWinningTeam(
    gameData,
    wasOvertimeRequired
  );

  // determine losing team
  otherStatDetails["losingTeam"] = determineLosingTeam(
    gameData,
    wasOvertimeRequired
  );

  // determine points for home team
  otherStatDetails["homeTeamPoints"] = determineHomeTeamPoints(
    gameData,
    wasOvertimeRequired
  );

  // determin points for away team
  otherStatDetails["awayTeamPoints"] = determineAwayTeamPoints(
    gameData,
    wasOvertimeRequired
  );

  // assign which league this game state is for
  otherStatDetails["league"] = leagueName;

  // get game length used on server to check gamestate is not a incomplete game
  otherStatDetails["GAME LENGTH"] = gameData[61][1];

  // get who the home team is
  otherStatDetails["homeTeam"] = gameData[1][1];

  // get who the away team is
  otherStatDetails["awayTeam"] = gameData[2][1];

  // get which team lost if game went to overtime
  const losingTeam = otherStatDetails["losingTeam"];

  // was the game a tie

  const homeTeamPoints = otherStatDetails["homeTeamPoints"];
  const awayTeamPoints = otherStatDetails["awayTeamPoints"];
  const isGameATie = (homePoints, awayPoints) => {
    if (homePoints == 1 && awayPoints == 1) {
      return true;
    }
    return false;
  };

  otherStatDetails["wasGameATie"] = isGameATie(homeTeamPoints, awayTeamPoints);

  if (wasOvertimeRequired && losingTeam != "tie") {
    otherStatDetails["overtimeLossTeam"] = losingTeam;
  } else {
    otherStatDetails["overtimeLossTeam"] = "";
  }
//TODO: remove unused date objects here if saved date ends up working
  // set timestamp on upload in eastern timezone
  const newDate = new Date();
  const estTime = new Date(
    newDate.toLocaleDateString("en-US", { timeZone: "America/New_York" })
  );
  otherStatDetails["submittedAt"] = new Date(Date.now());

  return otherStatDetails;
}

export default extractOtherGameStats;
