import readGoalieAttributes from "./read-csv/read-goalie-attributes.js";
import readSkatersAttributes from "./read-csv/read-skater-attributes.js";
import readTeamPositionCounts from "./read-csv/read-team-position-counts.js";
import extractHomeTeamData from "./parsing-helpers/extract-home-team-data.js";
import extractHomePlayerStats from "./parsing-helpers/extract-home-player-stats.js";
import extractHomeGoalieStats from "./parsing-helpers/extract-home-goalie-stats.js";
import extractAwayGoalieStats from "./parsing-helpers/extract-away-goalie-stats.js";
import extractAwayPlayerStats from "./parsing-helpers/extract-away-player-stats.js";
import extractAwayTeamData from "./parsing-helpers/extract-away-team-data.js";
import extractGoalData from "./parsing-helpers/extract-goal-data.js";
import extractPenaltyData from "./parsing-helpers/extract-penalty-data.js";
import extractOtherGameStats from "./parsing-helpers/extract-other-game-stats.js";

export async function readOgRomBinaryGameState(
  {file,
  seasonNumber,
  gameType,
  leagueName,
  teamsDictCodes}
) {
  const goalieDict = await readGoalieAttributes(leagueName, seasonNumber);
  const skaterDict = await readSkatersAttributes(leagueName, seasonNumber);
  const teamPositionNumbersDict = await readTeamPositionCounts(
    leagueName,
    seasonNumber
  );
  return new Promise((resolve, reject) => {

      const d = new Uint8Array(file);
      const teamCodesDict = teamsDictCodes;
      //////////////////////////////////////////////////////////////////////////////////////////////
      //this is object where hardcoded team acronyms would go in same order they appear in the ROM
      // example contains a single team. all teams need to be added in correct order
      //////////////////////////////////////////////////////////////////////////////////////////////

      try {
        // #Team stats

        // #Newer versions of RetroArch and Genesis Plus GX start the data 32 bytes
        // #later than older versions (for which this code was originally written)
        const offset = 32;

        // Away
        const awayGoals = d[50682 + offset];
        const awayPPGoals = d[50672 + offset];
        const awayPPTries = d[50674 + offset];
        const awayPPTime1 = d[51522 + offset];
        const awayPPTime2 = d[51523 + offset] * 256;
        const awayPPTime = awayPPTime1 + awayPPTime2;
        const awayPPShots = d[51524 + offset];
        const awaySHGoals = d[51526 + offset];
        const awaySHGoalsAgainst = d[50656 + offset];
        const awayBreakGoals = d[51530 + offset];
        const awayBreakTries = d[51528 + offset];
        const awayOneTimerGoals = d[51534 + offset];
        const awayOneTimerTries = d[51532 + offset];
        const awayPenShotGoals = d[51538 + offset];
        const awayPenShotTries = d[51536 + offset];
        const awayFaceoffWins = d[50684 + offset];
        const awayChecks = d[50686 + offset];
        const awayPenalties = d[50676 + offset];
        const awayPIM = d[50678 + offset];
        const awayAttackZoneTime1 = d[50680 + offset];
        const awayAttackZoneTime2 = d[50681 + offset] * 256;
        const awayAttackZoneTime = awayAttackZoneTime1 + awayAttackZoneTime2;
        const awayPassComps = d[50690 + offset];
        let awayPassTries = d[50688 + offset];

        //   #Adjust pass tries because if they're higher than 255, they show up as the
        //   #total minus 255

        if (awayPassTries < awayPassComps) {
          awayPassTries += 256;
        }

        const awayGoalsP1 = d[51506 + offset];
        const awayGoalsP2 = d[51508 + offset];
        const awayGoalsP3 = d[51510 + offset];
        const awayGoalsOT = d[51512 + offset];
        const awayShotsP1 = d[51514 + offset];
        const awayShotsP2 = d[51516 + offset];
        const awayShotsP3 = d[51518 + offset];
        const awayShotsOT = d[51520 + offset];
        const awayTeam = teamCodesDict[d[48982 + offset]];

        const awayShots = awayShotsP1 + awayShotsP2 + awayShotsP3 + awayShotsOT;
        let awayShootPct;
        if(awayShots > 0){
            awayShootPct = Math.round(awayGoals / awayShots) + "%";
        }else{
          awayShootPct = "0%"
        }

        // Home
        const homeGoals = d[49812 + offset];
        const homePPGoals = d[49802 + offset];
        const homePPTries = d[49804 + offset];
        const homePPTime1 = d[50652 + offset];
        const homePPTime2 = d[50653 + offset] * 256;
        const homePPTime = homePPTime1 + homePPTime2;
        const homePPShots = d[50654 + offset];
        const homeSHGoals = d[50656 + offset];
        const homeSHGoalsAgainst = d[51526 + offset];
        const homeBreakGoals = d[50660 + offset];
        const homeBreakTries = d[50658 + offset];
        const homeOneTimerGoals = d[50664 + offset];
        const homeOneTimerTries = d[50662 + offset];
        const homePenShotGoals = d[50668 + offset];
        const homePenShotTries = d[50666 + offset];
        const homeFaceoffWins = d[49814 + offset];
        const homeChecks = d[49816 + offset];
        const homePenalties = d[49806 + offset];
        const homePIM = d[49808 + offset];
        const homeAttackZoneTime1 = d[49810 + offset];
        const homeAttackZoneTime2 = d[49811 + offset] * 256;
        const homeAttackZoneTime = homeAttackZoneTime1 + homeAttackZoneTime2;
        const homePassComps = d[49820 + offset];
        let homePassTries = d[49818 + offset];

        //   #Adjust pass tries because if they're higher than 255, they show up as the
        //   #total minus 255

        if (homePassTries < homePassComps) {
          homePassTries += 256;
        }

        const homeGoalsP1 = d[50636 + offset];
        const homeGoalsP2 = d[50638 + offset];
        const homeGoalsP3 = d[50640 + offset];
        const homeGoalsOT = d[50642 + offset];
        const homeShotsP1 = d[50644 + offset];
        const homeShotsP2 = d[50646 + offset];
        const homeShotsP3 = d[50648 + offset];
        const homeShotsOT = d[50650 + offset];
        const homeTeam = teamCodesDict[d[48980 + offset]];

        const homeShots = homeShotsP1 + homeShotsP2 + homeShotsP3 + homeShotsOT;
        let homeShootPct;

        if(homeShots > 0){
          homeShootPct = Math.round(homeGoals / homeShots) + "%";
      }else{
        homeShootPct = "0%"
      }
  
        const faceoffTotal = awayFaceoffWins + homeFaceoffWins;
        //   #Get the roster information
        const awayGCount = +teamPositionNumbersDict[awayTeam]["goalies"];
        const awayFCount = +teamPositionNumbersDict[awayTeam]["forwards"];
        const awayDCount = +teamPositionNumbersDict[awayTeam]["defensemen"];
        
        const homeGCount = +teamPositionNumbersDict[homeTeam]["goalies"];
        const homeFCount = +teamPositionNumbersDict[homeTeam]["forwards"];
        const homeDCount = +teamPositionNumbersDict[homeTeam]["defensemen"];
        
        // #Prepare the lists for the away and home player stats
        const awayPlayerStats = Array.from(
          { length: awayGCount + awayFCount + awayDCount },
          () => []
        );
        // Extract the away player roster
        const awayPlayers = [
          ...goalieDict[awayTeam].map((item) => [item]),
          ...skaterDict[awayTeam].map((item) => [item]),
        ];
        // Add each player's position to each player's list
        for (let i = 0; i < awayGCount; i++) {
          awayPlayers[i].push("G");
        }

        for (let i = awayGCount; i < awayGCount + awayFCount; i++) {
          awayPlayers[i].push("F");
        }

        for (
          let i = awayGCount + awayFCount;
          i < awayGCount + awayFCount + awayDCount;
          i++
        ) {
          awayPlayers[i].push("D");
        }
        // Prepare the lists for the home player stats
        const homePlayerStats = Array.from(
          { length: homeGCount + homeFCount + homeDCount },
          () => []
        );

        // Extract the home player roster
        const homePlayers = [
          ...goalieDict[homeTeam].map((item) => [item]),
          ...skaterDict[homeTeam].map((item) => [item]),
        ];

        // Add each player's position to each player's list
        for (let i = 0; i < homeGCount; i++) {
          homePlayers[i].push("G");
        }

        for (let i = homeGCount; i < homeGCount + homeFCount; i++) {
          homePlayers[i].push("F");
        }

        for (
          let i = homeGCount + homeFCount;
          i < homeGCount + homeFCount + homeDCount;
          i++
        ) {
          homePlayers[i].push("D");
        }

        // Extract the goal summary
        // #We could use the number of goals that we calculated earlier to do this, but
        // #to be safe, we'll extract the game's specific byte for telling us how many
        // #bytes long the scoring summary is.
        const numGoals = d[49196 + offset] / 6;

        // #Blank array of arrays to hold the scoring summary
        let scoringSummaryList = new Array(numGoals);

        // #Dictionary with information about different goal types
        const goalTypeDict = {
          0: "Home SH2",
          1: "Home SH",
          2: "Home EV",
          3: "Home PP",
          4: "Home PP2",
          128: "Away SH2",
          129: "Away SH",
          130: "Away EV",
          131: "Away PP",
          132: "Away PP2",
        };

        // Object with information about different goal types
        for (let i = 0; i < numGoals; i++) {
          scoringSummaryList[i] = [];
        }

        // #Each goal summary is 6 bytes long
        // #Format in the output list:
        // #Period number, seconds, team, status, goal scorer, assist 1, assist 2
        let startByte = 49198 + offset;
        for (let i = 0; i < numGoals; i++) {
          // Period number
          let perFactor;
          if (d[startByte + 1 + i * 6] < 64) {
            perFactor = 0;
          } else if (
            d[startByte + 1 + i * 6] >= 64 &&
            d[startByte + 1 + i * 6] < 128
          ) {
            perFactor = 64;
          } else if (
            d[startByte + 1 + i * 6] >= 128 &&
            d[startByte + 1 + i * 6] < 192
          ) {
            perFactor = 128;
          } else {
            perFactor = 192;
          }
          const periodNum = Math.floor(perFactor / 64) + 1;
          scoringSummaryList[i].push(periodNum);

          // Number of seconds into the current period
          const secondsNum =
            (parseInt(d[startByte + 1 + i * 6]) - perFactor) * 256 +
            parseInt(d[startByte + i * 6]);
          scoringSummaryList[i].push(secondsNum);

          // Team and type of goal
          const [goalTeam, goalStatus] =
            goalTypeDict[d[startByte + 3 + i * 6]].split(" ");
          scoringSummaryList[i].push(goalTeam);
          scoringSummaryList[i].push(goalStatus);

          // Goal scorer
          const scorerRosterSlot = d[startByte + 2 + i * 6];
          const scorerName =
            goalTeam === "Home"
              ? homePlayers[scorerRosterSlot][0]
              : awayPlayers[scorerRosterSlot][0];
          scoringSummaryList[i].push(scorerName);

          // Assist1 player
          const assist1RosterSlot = d[startByte + 5 + i * 6];
          const assist1Name =
            assist1RosterSlot === 255
              ? ""
              : goalTeam === "Home"
              ? homePlayers[assist1RosterSlot][0]
              : awayPlayers[assist1RosterSlot][0];
          scoringSummaryList[i].push(assist1Name);

          // Assist2 player
          const assist2RosterSlot = d[startByte + 4 + i * 6];
          const assist2Name =
            assist2RosterSlot === 255
              ? ""
              : goalTeam === "Home"
              ? homePlayers[assist2RosterSlot][0]
              : awayPlayers[assist2RosterSlot][0];
          scoringSummaryList[i].push(assist2Name);
        }

        // #Extract the penalty summary

        // #Extract the number of penalties
        const numPens = d[49558 + offset] / 4;

        const penaltySummaryList = new Array(numPens);

        for (let i = 0; i < numPens; i++) {
          penaltySummaryList[i] = [];
        }

        // #Dictionary to decode penalties by team and type
        const teamPenDict = {
          18: "Home Boarding",
          22: "Home Charging",
          24: "Home Slashing",
          26: "Home Roughing",
          28: "Home Cross-Checking",
          30: "Home Hooking",
          32: "Home Tripping",
          34: "Home Interference",
          36: "Home Holding",
          38: "Home Fighting",
          146: "Away Boarding",
          150: "Away Charging",
          152: "Away Slashing",
          154: "Away Roughing",
          156: "Away Cross-Checking",
          158: "Away Hooking",
          160: "Away Tripping",
          162: "Away Interference",
          164: "Away Holding",
          166: "Away Fighting",
        };

        // #Each penalty summary is 4 bytes long
        // #Format in the output list:
        // #Period number, seconds, team, type, player
        startByte = 49560 + offset;

        for (let i = 0; i < numPens; i++) {
          // Period number
          let perFactor;
          if (d[startByte + 1 + i * 4] < 64) {
            perFactor = 0;
          } else if (
            d[startByte + 1 + i * 4] >= 64 &&
            d[startByte + 1 + i * 4] < 128
          ) {
            perFactor = 64;
          } else if (
            d[startByte + 1 + i * 4] >= 128 &&
            d[startByte + 1 + i * 4] < 192
          ) {
            perFactor = 128;
          } else {
            perFactor = 192;
          }
          const periodNum = Math.floor(perFactor / 64) + 1;
          penaltySummaryList[i].push(periodNum);

          // Number of seconds into the current period
          const secondsNum =
            (parseInt(d[startByte + 1 + i * 4]) - perFactor) * 256 +
            parseInt(d[startByte + i * 4]);
          penaltySummaryList[i].push(secondsNum);

          // Team and type of penalty
          const [penTeam, penType] =
            teamPenDict[d[startByte + 3 + i * 4]].split(" ");
          penaltySummaryList[i].push(penTeam);
          penaltySummaryList[i].push(penType);

          // Player
          const playerRosterSlot = d[startByte + 2 + i * 4];
          const playerName =
            penTeam === "Home"
              ? homePlayers[playerRosterSlot][0]
              : awayPlayers[playerRosterSlot][0];
          penaltySummaryList[i].push(playerName);
        }

        // #Calculate the length of the game. This is useful because the TOI
        // #calculation occasionally outputs a TOI that's longer than the actual game.
        // #This way, we can at least trim TOIs that are longer than the game length.

        // #Calculate whether there was OT or not. There's no single byte that stores
        // #this info, so we'll infer this info from whether or not there were any OT
        // #goals or shots.
        let OT = 0; // Initialize OT flag to 0

        if (
          awayGoalsOT > 0 ||
          awayShotsOT > 0 ||
          homeGoalsOT > 0 ||
          homeShotsOT > 0
        ) {
          OT = 1;
        } else {
          try {
            if (penaltySummaryList[penaltySummaryList.length - 1][0] === 4) {
              OT = 1;
            } else {
              OT = 0;
            }
          } catch (error) {
            OT = 0;
          }
        }

        let gameLength;

        if (!OT) {
          gameLength = 900; // If there was no OT, game length is 900 seconds
        } else {
          if (homeGoals === awayGoals) {
            gameLength = 1200; // Full OT played if the game finished tied
          } else {
            const otLength =
              scoringSummaryList[scoringSummaryList.length - 1][1];
            gameLength = 900 + otLength; // Game length with added OT time
          }
        }

        // #Now extract the player stats for all skaters and goalies. We'll extract
        // #the same numbers for skaters and for goalies, treating them all as if they
        // #are skaters. Once that is done, we'll go back to the goalie stats and fix
        // #those.

        // #The reason for swapVal is that the goal/assist/whatever counts are arranged
        // #in the order 01 00 03 02 05 04 etc., and so the swapVal addition allows
        // #us to go through the players in roster order.
        let swapVal = 1;

        for (let i = 0; i < awayGCount + awayFCount + awayDCount; i++) {
          // Start in the right location in the save state
          let startByte = 50852 + offset;

          // Team
          awayPlayerStats[i].push(awayTeam);

          // Player Name
          awayPlayerStats[i].push(awayPlayers[i][0]);

          // Position
          awayPlayerStats[i].push(awayPlayers[i][1]);

          // Goals
          let byteJump = 0;
          awayPlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // Assists
          byteJump = 26;
          awayPlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // Points
          awayPlayerStats[i].push(
            awayPlayerStats[i][3] + awayPlayerStats[i][4]
          );

          // Shots on goal
          byteJump = 52;
          awayPlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // Checks For
          byteJump = 104;
          awayPlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // PIM
          byteJump = 78;
          awayPlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // TOI
          byteJump = 130;
          const TOIMinutes = d[startByte + byteJump + 1 + i * 2] * 256;
          const TOISeconds = d[startByte + byteJump - 0 + i * 2];
          let TOI = TOIMinutes + TOISeconds;

          // Occasionally, TOI is higher than the length of the game because the game doesn't quite calculate it correctly all of the time.
          // If so, then we'll trim it to the length of the game
          TOI = Math.min(TOI, gameLength);

          awayPlayerStats[i].push(TOI);

          swapVal *= -1;
        }

        // #Clean up the goalie stats - keep position 3 (goals against), 4 (assists),
        // #6 (shots against), 9 (TOI)
        for (let i = 0; i < awayGCount; i++) {
          awayPlayerStats[i].splice(8, 1); // Remove element at index 8
          awayPlayerStats[i].splice(7, 1); // Remove element at index 7
          awayPlayerStats[i].splice(5, 1); // Remove element at index 5

          try {
            let shootingPercentage = (
              (awayPlayerStats[i][5] - awayPlayerStats[i][3]) /
              awayPlayerStats[i][5]
            ).toFixed(3);
            shootingPercentage = isNaN(shootingPercentage)
              ? 0.0
              : Number(shootingPercentage);
            awayPlayerStats[i].push(shootingPercentage);
          } catch (error) {
            awayPlayerStats[i].push(0.0);
          }
        }

        // #Now extract the player stats for all skaters and goalies. We'll extract
        // #the same numbers for skaters and for goalies, treating them all as if they
        // #are skaters. Once that is done, we'll go back to the goalie stats and fix
        // #those.

        // #The reason for swapVal is that the goal/assist/whatever counts are arranged
        // #in the order 01 00 03 02 05 04 etc., and so the swapVal addition allows
        // #us to go through the players in roster order.
        swapVal = 1;

        for (let i = 0; i < homeGCount + homeFCount + homeDCount; i++) {
          // Start in the right location in the save state
          startByte = 49982 + offset;

          // Team
          homePlayerStats[i].push(homeTeam);

          // Player Name
          homePlayerStats[i].push(homePlayers[i][0]);

          // Position
          homePlayerStats[i].push(homePlayers[i][1]);

          // Goals
          let byteJump = 0;
          homePlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // Assists
          byteJump = 26;
          homePlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // Points
          homePlayerStats[i].push(
            homePlayerStats[i][3] + homePlayerStats[i][4]
          );

          // Shots on goal
          byteJump = 52;
          homePlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // Checks For
          byteJump = 104;
          homePlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // PIM
          byteJump = 78;
          homePlayerStats[i].push(d[startByte + byteJump + i + swapVal]);

          // TOI
          byteJump = 130;
          const TOIMinutes = d[startByte + byteJump + 1 + i * 2] * 256;
          const TOISeconds = d[startByte + byteJump - 0 + i * 2];
          let TOI = TOIMinutes + TOISeconds;

          // Occasionally, TOI is higher than the length of the game because the game doesn't quite calculate it correctly all of the time.
          // If so, then we'll trim it to the length of the game
          TOI = Math.min(TOI, gameLength);

          homePlayerStats[i].push(TOI);

          swapVal *= -1;
        }

        // #Clean up the goalie stats - keep position 3 (goals against), 4 (assists),
        // #6 (shots against), 9 (TOI)
        for (let i = 0; i < homeGCount; i++) {
          homePlayerStats[i].splice(8, 1); // Remove element at index 8
          homePlayerStats[i].splice(7, 1); // Remove element at index 7
          homePlayerStats[i].splice(5, 1); // Remove element at index 5

          try {
            let shootingPercentage = (
              (homePlayerStats[i][5] - homePlayerStats[i][3]) /
              homePlayerStats[i][5]
            ).toFixed(3);
            shootingPercentage = isNaN(shootingPercentage)
              ? 0.0
              : Number(shootingPercentage);
            homePlayerStats[i].push(shootingPercentage);
          } catch (error) {
            homePlayerStats[i].push(0.0);
          }
        }
        // #Assemble all of the stats within a object
        const statsDict = {};
        statsDict["awayTeam"] = awayTeam;
        statsDict["awayGoals"] = awayGoals;
        statsDict["awayShots"] = awayShots;
        statsDict["awayShootPct"] = awayShootPct;
        statsDict["awayPPGoals"] = awayPPGoals;
        statsDict["awayPPTries"] = awayPPTries;
        statsDict["awayPPTime"] = `${Math.floor(awayPPTime / 60)}:${
          awayPPTime % 60 < 10 ? "0" : ""
        }${awayPPTime % 60}`;
        statsDict["awayPPShots"] = awayPPShots;
        statsDict["awaySHGoals"] = awaySHGoals;
        statsDict["awayBreakGoals"] = awayBreakGoals;
        statsDict["awayBreakTries"] = awayBreakTries;
        statsDict["awayOneTimerGoals"] = awayOneTimerGoals;
        statsDict["awayOneTimerTries"] = awayOneTimerTries;
        statsDict["awayPenShotGoals"] = awayPenShotGoals;
        statsDict["awayPenShotTries"] = awayPenShotTries;
        statsDict["awayFaceoffWins"] = awayFaceoffWins;
        statsDict["awayChecks"] = awayChecks;
        statsDict["awayPenalties"] = awayPenalties;
        statsDict["awayPIM"] = awayPIM;
        statsDict["awayAttackZoneTime"] = `${Math.floor(
          awayAttackZoneTime / 60
        )}:${awayAttackZoneTime % 60 < 10 ? "0" : ""}${
          awayAttackZoneTime % 60
        }`;
        statsDict["awayPassComps"] = awayPassComps;
        statsDict["awayPassTries"] = awayPassTries;
        statsDict["awayGoalsP1"] = awayGoalsP1;
        statsDict["awayGoalsP2"] = awayGoalsP2;
        statsDict["awayGoalsP3"] = awayGoalsP3;
        statsDict["awayGoalsOT"] = awayGoalsOT;
        statsDict["awayShotsP1"] = awayShotsP1;
        statsDict["awayShotsP2"] = awayShotsP2;
        statsDict["awayShotsP3"] = awayShotsP3;
        statsDict["awayShotsOT"] = awayShotsOT;
        statsDict["homeTeam"] = homeTeam;
        statsDict["homeGoals"] = homeGoals;
        statsDict["homeShots"] = homeShots;
        statsDict["homeShootPct"] = homeShootPct;
        statsDict["homePPGoals"] = homePPGoals;
        statsDict["homePPTries"] = homePPTries;
        statsDict["homePPTime"] = `${Math.floor(homePPTime / 60)}:${
          homePPTime % 60 < 10 ? "0" : ""
        }${homePPTime % 60}`;
        statsDict["homePPShots"] = homePPShots;
        statsDict["homeSHGoals"] = homeSHGoals;
        statsDict["homeBreakGoals"] = homeBreakGoals;
        statsDict["homeBreakTries"] = homeBreakTries;
        statsDict["homeOneTimerGoals"] = homeOneTimerGoals;
        statsDict["homeOneTimerTries"] = homeOneTimerTries;
        statsDict["homePenShotGoals"] = homePenShotGoals;
        statsDict["homePenShotTries"] = homePenShotTries;
        statsDict["homeFaceoffWins"] = homeFaceoffWins;
        statsDict["homeChecks"] = homeChecks;
        statsDict["homePenalties"] = homePenalties;
        statsDict["homePIM"] = homePIM;
        statsDict["homeAttackZoneTime"] = `${Math.floor(
          homeAttackZoneTime / 60
        )}:${homeAttackZoneTime % 60 < 10 ? "0" : ""}${
          homeAttackZoneTime % 60
        }`;
        statsDict["homePassComps"] = homePassComps;
        statsDict["homePassTries"] = homePassTries;
        statsDict["homeGoalsP1"] = homeGoalsP1;
        statsDict["homeGoalsP2"] = homeGoalsP2;
        statsDict["homeGoalsP3"] = homeGoalsP3;
        statsDict["homeGoalsOT"] = homeGoalsOT;
        statsDict["homeShotsP1"] = homeShotsP1;
        statsDict["homeShotsP2"] = homeShotsP2;
        statsDict["homeShotsP3"] = homeShotsP3;
        statsDict["homeShotsOT"] = homeShotsOT;
        statsDict["matchup"] = `${awayTeam}/${homeTeam}`;
        statsDict["totalFaceoffs"] = awayFaceoffWins + homeFaceoffWins;
        statsDict["OT"] = OT;
        statsDict["gameLength"] = `${Math.floor(gameLength / 60)}:${
          gameLength % 60 < 10 ? "0" : ""
        }${gameLength % 60}`;
        // #Home player stats

        // #Home goalie stats
  
        // #Start by figuring out which goalie is the goalie of record (greater
        // #TOI)
        let recGoalie;
        if (homePlayerStats[0][6] >= homePlayerStats[1][6]) {
          recGoalie = 0;
        } else {
          recGoalie = 1;
        }

        for (let i = 0; i < homeGCount; i++) {
          // Check whether the goalie scored any goals
          const goalieName = homePlayerStats[i][1];
          let goalieGoalCount = 0;
          for (let goal of scoringSummaryList) {
            if (goal[4] === goalieName) {
              goalieGoalCount++;
            }
          }

          // Calculate the goalie's W/L/T/OTL info
          let W, L, T, OTL;
          if (recGoalie === i) {
            W = homeGoals > awayGoals ? 1 : 0;
            L = homeGoals < awayGoals && statsDict["OT"] === 0 ? 1 : 0;
            T = homeGoals === awayGoals ? 1 : 0;
            OTL = homeGoals < awayGoals && statsDict["OT"] === 1 ? 1 : 0;
          } else {
            W = 0;
            L = 0;
            T = 0;
            OTL = 0;
          }
          // Create the goalie's stats object
          statsDict[`homeGoalie${i + 1}`] = {
            name: goalieName,
            pos: homePlayerStats[i][2],
            goals: goalieGoalCount,
            assists: homePlayerStats[i][4],
            points: goalieGoalCount + homePlayerStats[i][4],
            SO: homePlayerStats[i][3] === 0 && recGoalie === i ? 1 : 0,
            GA: homePlayerStats[i][3],
            saves: homePlayerStats[i][5] - homePlayerStats[i][3],
            shots: homePlayerStats[i][5],
            savePct: homePlayerStats[i][7],
            W: W,
            L: L,
            T: T,
            OTL: OTL,
            TOI: `${Math.floor(homePlayerStats[i][6] / 60)}:${
              homePlayerStats[i][6] % 60 < 10 ? "0" : ""
            }${homePlayerStats[i][6] % 60}`,
          };
        }

        //TODO: some teams have 3 goalies so have to add a goalie object if team only has 2 goalies
        // if home team has 2 goalies add a 3rd
        if(homeGCount < 3){
          statsDict[`homeGoalie${3}`] = {
            name: "-",
            pos: "-",
            goals: 0,
            assists: 0,
            points: 0,
            SO: 0,
            GA: 0,
            saves: 0,
            shots: 0,
            savePct: 0,
            W: 0,
            L: 0,
            T: 0,
            OTL: 0,
            TOI: "0:00",
          };
        }

        // #Home skater stats
        // get home skater count
        const homeSkaterCount = homeDCount+homeFCount;
        // determine starting index depending on goalies count and
        // set statsDict number reduced my 1 or 2 depending on goalie count
        let startingSkaterIndex;
        let reduceHomeSkaterIndex;
        if(homeGCount == 2){
          startingSkaterIndex = 2;
          reduceHomeSkaterIndex = 1
        } else {
          // if goalie count is 3
          startingSkaterIndex = 3
          reduceHomeSkaterIndex = 2
        }
      
        for (let i = startingSkaterIndex; i < homeSkaterCount+startingSkaterIndex; i++) {
          const skaterName = homePlayerStats[i][1];
          // Calculate how many power play and shorthanded points the player has
          let playerPPP = 0;
          let playerSHP = 0;

          for (let goal of scoringSummaryList) {
            if (
              goal[3].substring(0, 2) === "PP" &&
              [goal[4], goal[5], goal[6]].includes(skaterName)
            ) {
              playerPPP++;
            } else if (
              goal[3].substring(0, 2) === "SH" &&
              [goal[4], goal[5], goal[6]].includes(skaterName)
            ) {
              playerSHP++;
            }
          }
          // Create the skater's stats object
          statsDict[`homeSkater${i-reduceHomeSkaterIndex}`] = {
            name: skaterName,
            pos: homePlayerStats[i][2],
            goals: homePlayerStats[i][3],
            assists: homePlayerStats[i][4],
            points: homePlayerStats[i][5],
            SOG: homePlayerStats[i][6],
            checks: homePlayerStats[i][7],
            PIM: homePlayerStats[i][8],
            PPP: playerPPP,
            SHP: playerSHP,
            TOI: `${Math.floor(homePlayerStats[i][9] / 60)}:${
              homePlayerStats[i][9] % 60 < 10 ? "0" : ""
            }${homePlayerStats[i][9] % 60}`,
          };
        }
// TODO: some teams have less than 22 skaters so need to create player objects for teams with less
// create blank skater objects for home teams with less than 22 skaters
        if(homeSkaterCount < 22){
          const missingSkaterCount = 22 - homeSkaterCount;
          for(let i=missingSkaterCount;i>0;i--){

            statsDict[`homeSkater${23-i}`] = {
              name: "-",
              pos: "-",
              goals: "-",
              assists: "-",
              points: "-",
              SOG: "-",
              checks: "-",
              PIM: "-",
              PPP: "-",
              SHP: "-",
              TOI: "-",
            };
          }
        }
        // #Away player stats

        // #Away goalie stats

        // #Start by figuring out which goalie is the goalie of record (greater
        // #TOI)
        recGoalie;
        if (awayPlayerStats[0][6] >= awayPlayerStats[1][6]) {
          recGoalie = 0;
        } else {
          recGoalie = 1;
        }

        for (let i = 0; i < awayGCount; i++) {
          // Check whether the goalie scored any goals
          const goalieName = awayPlayerStats[i][1];
          let goalieGoalCount = 0;
          for (let goal of scoringSummaryList) {
            if (goal[4] === goalieName) {
              goalieGoalCount++;
            }
          }

          // Calculate the goalie's W/L/T/OTL info
          let W, L, T, OTL;
          if (recGoalie === i) {
            W = awayGoals > homeGoals ? 1 : 0;
            L = awayGoals < homeGoals && statsDict["OT"] === 0 ? 1 : 0;
            T = awayGoals === homeGoals ? 1 : 0;
            OTL = awayGoals < homeGoals && statsDict["OT"] === 1 ? 1 : 0;
          } else {
            W = 0;
            L = 0;
            T = 0;
            OTL = 0;
          }

          // Create the goalie's stats object
          statsDict[`awayGoalie${i + 1}`] = {
            name: goalieName,
            pos: awayPlayerStats[i][2],
            goals: goalieGoalCount,
            assists: awayPlayerStats[i][4],
            points: goalieGoalCount + awayPlayerStats[i][4],
            SO: awayPlayerStats[i][3] === 0 && recGoalie === i ? 1 : 0,
            GA: awayPlayerStats[i][3],
            saves: awayPlayerStats[i][5] - awayPlayerStats[i][3],
            shots: awayPlayerStats[i][5],
            savePct: awayPlayerStats[i][7],
            W: W,
            L: L,
            T: T,
            OTL: OTL,
            TOI: `${Math.floor(awayPlayerStats[i][6] / 60)}:${
              awayPlayerStats[i][6] % 60 < 10 ? "0" : ""
            }${awayPlayerStats[i][6] % 60}`,
          };
        }

        //TODO: some teams have 3 goalies so have to add a goalie object if team only has 2 goalies
        // if away team has 2 goalies add a 3rd
                if(awayGCount < 3){
                  statsDict[`awayGoalie${3}`] = {
                    name: "-",
                    pos: "-",
                    goals: 0,
                    assists: 0,
                    points: 0,
                    SO: 0,
                    GA: 0,
                    saves: 0,
                    shots: 0,
                    savePct: 0,
                    W: 0,
                    L: 0,
                    T: 0,
                    OTL: 0,
                    TOI: "0:00",
                  };
                }

        // get away skater count
        const awaySkaterCount = awayDCount+awayFCount
        // determine starting index depending on goalies count and
        // set statsDict number reduced my 1 or 2 depending on goalie count
        if(awayGCount == 2){
          startingSkaterIndex = 2;
          reduceHomeSkaterIndex = 1
        } else {
          // if goalie count is 3
          startingSkaterIndex = 3
          reduceHomeSkaterIndex = 2
        }
        for (let i = startingSkaterIndex; i < awaySkaterCount+startingSkaterIndex; i++) {
          const skaterName = awayPlayerStats[i][1];

          // Calculate how many power play and shorthanded points the player has
          let playerPPP = 0;
          let playerSHP = 0;

          for (let goal of scoringSummaryList) {
            if (
              goal[3].substring(0, 2) === "PP" &&
              [goal[4], goal[5], goal[6]].includes(skaterName)
            ) {
              playerPPP++;
            } else if (
              goal[3].substring(0, 2) === "SH" &&
              [goal[4], goal[5], goal[6]].includes(skaterName)
            ) {
              playerSHP++;
            }
          }

          // Create the skater's stats object
          statsDict[`awaySkater${i - reduceHomeSkaterIndex}`] = {
            name: skaterName,
            pos: awayPlayerStats[i][2],
            goals: awayPlayerStats[i][3],
            assists: awayPlayerStats[i][4],
            points: awayPlayerStats[i][5],
            SOG: awayPlayerStats[i][6],
            checks: awayPlayerStats[i][7],
            PIM: awayPlayerStats[i][8],
            PPP: playerPPP,
            SHP: playerSHP,
            TOI: `${Math.floor(awayPlayerStats[i][9] / 60)}:${
              awayPlayerStats[i][9] % 60 < 10 ? "0" : ""
            }${awayPlayerStats[i][9] % 60}`,
          };
        }
// TODO: some teams have less than 22 skaters so need to create player objects for teams with less
// create blank skater objects for away teams with less than 22 skaters
if(awaySkaterCount < 22){
  const missingSkaterCount = 22 - awaySkaterCount;
  for(let i=missingSkaterCount;i>0;i--){
    statsDict[`awaySkater${23-i}`] = {
      name: "-",
      pos: "-",
      goals: "-",
      assists: "-",
      points: "-",
      SOG: "-",
      checks: "-",
      PIM: "-",
      PPP: "-",
      SHP: "-",
      TOI: "-",
    };
  }
}

        // Initialize an array to store the goal objects
        const goalObjects = [];

        // Loop through the first 15 goals (or fewer if there aren't that many)
        for (let i = 0; i < 15; i++) {
          // Determine whether it's a legitimate goal or not
          if (i < scoringSummaryList.length) {
            // Goal #, Period, Time, Team, Scorer, Assist 1, Assist 2
            const goal = scoringSummaryList[i];
            const goalObj = {
              goalNum: i + 1,
              period: goal[0],
              // Format the time as a string
              time: `${Math.floor(goal[1] / 60)}:${
                goal[1] % 60 < 10 ? "0" : ""
              }${goal[1] % 60}`,
              team: goal[2] === "Home" ? homeTeam : awayTeam,
              scorer: goal[4],
              assist1: goal[5],
              assist2: goal[6],
              type: goal[3],
            };
            goalObjects.push(goalObj);
          } else {
            // Fill in placeholder values
            goalObjects.push({
              goalNum: "-",
              period: "-",
              time: "-",
              team: "-",
              scorer: "-",
              assist1: "-",
              assist2: "-",
              type: "-",
            });
          }
        }

        // Create properties in statsDict for each goal object
        for (let i = 0; i < goalObjects.length; i++) {
          statsDict[`Goal${i + 1}`] = goalObjects[i];
        }

        // Initialize an array to store the penalty objects
        const penaltyObjects = [];

        // Loop through the first 15 penalties (or fewer if there aren't that many)
        for (let i = 0; i < 15; i++) {
          // Determine whether it's a legitimate penalty or not
          if (i < penaltySummaryList.length) {
            // Pen #, Period, Time, Team, Player, Type
            const penalty = penaltySummaryList[i];
            const penaltyObj = {
              penNum: i + 1,
              period: penalty[0],
              // Format the time as a string
              time: `${Math.floor(penalty[1] / 60)}:${
                penalty[1] % 60 < 10 ? "0" : ""
              }${penalty[1] % 60}`,
              team: penalty[2] === "Home" ? homeTeam : awayTeam,
              player: penalty[4],
              type: penalty[3],
            };
            penaltyObjects.push(penaltyObj);
          } else {
            // Fill in placeholder values
            penaltyObjects.push({
              penNum: "-",
              period: "-",
              time: "-",
              team: "-",
              player: "-",
              type: "-",
            });
          }
        }

        // Create properties in statsDict for each penalty object
        for (let i = 0; i < penaltyObjects.length; i++) {
          statsDict[`Penalty${i + 1}`] = penaltyObjects[i];
        }

        /////////////////////////////
        // end of processing
        /////////////////////////////

        var headerRow = [
          "Matchup",
          "HomeTeam",
          "AwayTeam",
          "AwaySHOTS",
          "AwayPENALTIES",
          "AwayPIM",
          "AwayATTACK",
          "AwayGOALS",
          "AwayFACEOFFS WON",
          "AwayCHECKS",
          "AwayPASS ATT",
          "AwayPASS COMP",
          "AwayPP MIN",
          "AwayPP GOALS",
          "AwayPP OPP",
          "AwayPP SHOTS",
          "AwaySHG",
          "AwayBREAKAWAY",
          "AwayBREAKAWAY GOALS",
          "Away1X ATT",
          "Away1X GOALS",
          "AwayPENALTY SHOTS",
          "AwayPENALTY SHOT GOALS",
          "Away1ST SHOTS",
          "Away2ND SHOTS",
          "Away3RD SHOTS",
          "AwayOT SHOTS",
          "Away1ST GOALS",
          "Away2ND GOALS",
          "Away3RD GOALS",
          "AwayOT GOALS",
          "HomeSHOTS",
          "HomePENALTIES",
          "HomePIM",
          "HomeATTACK",
          "HomeGOALS",
          "HomeFACEOFFS WON",
          "HomeCHECKS",
          "HomePASS ATT",
          "HomePASS COMP",
          "HomePP MIN",
          "HomePP GOALS",
          "HomePP OPP",
          "HomePP SHOTS",
          "HomeSHG",
          "HomeBREAKAWAY",
          "HomeBREAKAWAY GOALS",
          "Home1X ATT",
          "Home1X GOALS",
          "HomePENALTY SHOTS",
          "HomePENALTY SHOT GOALS",
          "Home1ST SHOTS",
          "Home2ND SHOTS",
          "Home3RD SHOTS",
          "HomeOT SHOTS",
          "Home1ST GOALS",
          "Home2ND GOALS",
          "Home3RD GOALS",
          "HomeOT GOALS",
          "TOTAL FO",
          "OT Game",
          "GAME LENGTH",
        ];
        // Convert the Python list to a JavaScript array of arrays
        var headerArray = headerRow.map(function (item) {
          return [item];
        });

        // Define the number of goalies (3 in this case)
        const numGoalies = 3;

        // Define the additional headers for "Away Goalies"
        const goalieHeaders = [
          "Name",
          "Pos",
          "G",
          "A",
          "PTS",
          "SO",
          "GA",
          "SV",
          "SH",
          "SV%",
          "W",
          "L",
          "T",
          "OTL",
          "TOI",
        ];
        // away goalies
        // Define the number of goalies (3 in this case)
        const goalieCount = 3;

        // Spread the goalieHeaders into headerArray for the specified number of goalies
        for (let i = 0; i < goalieCount; i++) {
          headerArray.push(...goalieHeaders.map((item) => [item]));
        }
        // Define the additional headers for "Away Skaters"
        const skaterHeaders = [
          "Name",
          "Pos",
          "G",
          "A",
          "PTS",
          "SOG",
          "CHK",
          "PIM",
          "PPP",
          "SHP",
          "TOI",
        ];

        // Define the number of skaters (22 in this case)
        const skaterCount = 22;

        // Spread the skaterHeaders into headerArray for the specified number of skaters
        for (let i = 0; i < skaterCount; i++) {
          headerArray.push(...skaterHeaders.map((item) => [item]));
        }

        // home goalies

        // Spread the goalieHeaders into headerArray for the specified number of goalies
        for (let i = 0; i < goalieCount; i++) {
          headerArray.push(...goalieHeaders.map((item) => [item]));
        }

        // home skaters
        // Spread the skaterHeaders into headerArray for the specified number of skaters
        for (let i = 0; i < skaterCount; i++) {
          headerArray.push(...skaterHeaders.map((item) => [item]));
        }

        // Define the additional headers for "Scoring Summary"
        const scoringSummaryHeaders = [
          "Goal#",
          "Period",
          "TIME",
          "TEAM",
          "GOALscorer",
          "ASSIST 1",
          "ASSIST 2",
          "TYPE",
        ];
        // Define the number of goals (15 in this case)
        const goalCount = 15;

        // Loop to add "Scoring Summary" headers to headerArray
        for (let i = 0; i < goalCount; i++) {
          headerArray.push(...scoringSummaryHeaders.map((item) => [item]));
        }

        const penaltySummaryHeaders = [
          "Pen#",
          "PERIOD",
          "TIME",
          "TEAM",
          "Penalty",
          "Type",
        ];

        // define the number of penalties (room for 15 penalties)
        const penaltyCount = 15;
        // Loop to add "Scoring Summary" headers to headerArray
        for (let i = 0; i < penaltyCount; i++) {
          headerArray.push(...penaltySummaryHeaders.map((item) => [item]));
        }
        ///////////////////////////////////////////////////////////////////////
        // create master data container
        // headerArray will be paired up with info contained within statDict
        ///////////////////////////////////////////////////////////////////////
        // # Matchup Info
        headerArray[0].push(statsDict["matchup"]);
        headerArray[1].push(statsDict["homeTeam"]);
        headerArray[2].push(statsDict["awayTeam"]);
        // # Away Team Stats
        headerArray[3].push(statsDict["awayShots"]);
        headerArray[4].push(statsDict["awayPenalties"]);
        headerArray[5].push(statsDict["awayPIM"]);
        headerArray[6].push(statsDict["awayAttackZoneTime"]);
        headerArray[7].push(statsDict["awayGoals"]);
        headerArray[8].push(statsDict["awayFaceoffWins"]);
        headerArray[9].push(statsDict["awayChecks"]);
        headerArray[10].push(statsDict["awayPassTries"]);
        headerArray[11].push(statsDict["awayPassComps"]);
        headerArray[12].push(statsDict["awayPPTime"]);
        headerArray[13].push(statsDict["awayPPGoals"]);
        headerArray[14].push(statsDict["awayPPTries"]);
        headerArray[15].push(statsDict["awayPPShots"]);
        headerArray[16].push(statsDict["awaySHGoals"]);
        headerArray[17].push(statsDict["awayBreakTries"]);
        headerArray[18].push(statsDict["awayBreakGoals"]);
        headerArray[19].push(statsDict["awayOneTimerTries"]);
        headerArray[20].push(statsDict["awayOneTimerGoals"]);
        headerArray[21].push(statsDict["awayPenShotTries"]);
        headerArray[22].push(statsDict["awayPenShotGoals"]);
        headerArray[23].push(statsDict["awayShotsP1"]);
        headerArray[24].push(statsDict["awayShotsP2"]);
        headerArray[25].push(statsDict["awayShotsP3"]);
        headerArray[26].push(statsDict["awayShotsOT"]);
        headerArray[27].push(statsDict["awayGoalsP1"]);
        headerArray[28].push(statsDict["awayGoalsP2"]);
        headerArray[29].push(statsDict["awayGoalsP3"]);
        headerArray[30].push(statsDict["awayGoalsOT"]);

        // # Home Team Stats
        headerArray[31].push(statsDict["homeShots"]);
        headerArray[32].push(statsDict["homePenalties"]);
        headerArray[33].push(statsDict["homePIM"]);
        headerArray[34].push(statsDict["homeAttackZoneTime"]);
        headerArray[35].push(statsDict["homeGoals"]);
        headerArray[36].push(statsDict["homeFaceoffWins"]);
        headerArray[37].push(statsDict["homeChecks"]);
        headerArray[38].push(statsDict["homePassTries"]);
        headerArray[39].push(statsDict["homePassComps"]);
        headerArray[40].push(statsDict["homePPTime"]);
        headerArray[41].push(statsDict["homePPGoals"]);
        headerArray[42].push(statsDict["homePPTries"]);
        headerArray[43].push(statsDict["homePPShots"]);
        headerArray[44].push(statsDict["homeSHGoals"]);
        headerArray[45].push(statsDict["homeBreakTries"]);
        headerArray[46].push(statsDict["homeBreakGoals"]);
        headerArray[47].push(statsDict["homeOneTimerTries"]);
        headerArray[48].push(statsDict["homeOneTimerGoals"]);
        headerArray[49].push(statsDict["homePenShotTries"]);
        headerArray[50].push(statsDict["homePenShotGoals"]);
        headerArray[51].push(statsDict["homeShotsP1"]);
        headerArray[52].push(statsDict["homeShotsP2"]);
        headerArray[53].push(statsDict["homeShotsP3"]);
        headerArray[54].push(statsDict["homeShotsOT"]);
        headerArray[55].push(statsDict["homeGoalsP1"]);
        headerArray[56].push(statsDict["homeGoalsP2"]);
        headerArray[57].push(statsDict["homeGoalsP3"]);
        headerArray[58].push(statsDict["homeGoalsOT"]);

        // # Remaining game stats
        headerArray[59].push(statsDict["totalFaceoffs"]);
        headerArray[60].push(statsDict["OT"]);
        headerArray[61].push(statsDict["gameLength"]);

        // away goalie stats
        let goalieStatsIndexStart = 62;
        // loop through based on 3 goalies on the team
        for (let i = 1; i <= goalieCount; i++) {
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["name"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["pos"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["goals"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["assists"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["points"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["SO"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["GA"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["saves"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["shots"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["savePct"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["W"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["L"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["T"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["OTL"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`awayGoalie${i}`]["TOI"]
          );
        }

        // away skater stats
        let awaySkaterStatsIndexStart = 107;
        // loop through based on skaters on the team
        for (let i = 1; i < skaterCount+1; i++) {
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["name"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["pos"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["goals"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["assists"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["points"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["SOG"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["checks"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["PIM"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["PPP"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["SHP"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`awaySkater${i}`]["TOI"]
          );
        }

        // home goalie stats
        goalieStatsIndexStart = 349;
        // loop through based on goalies count for that team
        for (let i = 1; i <=goalieCount; i++) {
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["name"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["pos"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["goals"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["assists"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["points"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["SO"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["GA"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["saves"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["shots"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["savePct"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["W"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["L"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["T"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["OTL"]
          );
          headerArray[goalieStatsIndexStart++].push(
            statsDict[`homeGoalie${i}`]["TOI"]
          );
        }

        // away skater stats
        awaySkaterStatsIndexStart = 394;
        // loop through based on skaters count for that team
        for (let i = 1; i < skaterCount+1; i++) {
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["name"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["pos"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["goals"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["assists"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["points"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["SOG"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["checks"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["PIM"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["PPP"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["SHP"]
          );
          headerArray[awaySkaterStatsIndexStart++].push(
            statsDict[`homeSkater${i}`]["TOI"]
          );
        }

        // scoring summary
        let scoringSummaryIndexStart = 636;
        // room for 15 total goals
        for (let i = 1; i <= 15; i++) {
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["goalNum"]
          );
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["period"]
          );
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["time"]
          );
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["team"]
          );
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["scorer"]
          );
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["assist1"]
          );
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["assist2"]
          );
          headerArray[scoringSummaryIndexStart++].push(
            statsDict[`Goal${i}`]["type"]
          );
        }
        // penalty summary
        let penaltySummaryIndexStart = 756;
        // room for 15 total penalties
        for (let i = 1; i <= 15; i++) {
          headerArray[penaltySummaryIndexStart++].push(
            statsDict[`Penalty${i}`]["penNum"]
          );
          headerArray[penaltySummaryIndexStart++].push(
            statsDict[`Penalty${i}`]["period"]
          );
          headerArray[penaltySummaryIndexStart++].push(
            statsDict[`Penalty${i}`]["time"]
          );
          headerArray[penaltySummaryIndexStart++].push(
            statsDict[`Penalty${i}`]["team"]
          );
          headerArray[penaltySummaryIndexStart++].push(
            statsDict[`Penalty${i}`]["player"]
          );
          headerArray[penaltySummaryIndexStart++].push(
            statsDict[`Penalty${i}`]["type"]
          );
        }
        ///////////////////////////////////////////////////////////////////////
        // end master data container
        //////////////////////////////////////////////////////////////////////

        const GAME_DATA = {};

        // true boolean is stating this is the original rom which has a larger array of stats

        // get home team stats
        GAME_DATA["homeTeamGameStats"] = extractHomeTeamData(headerArray);

        // get home team player stats
        GAME_DATA["homeTeamPlayerStats"] = extractHomePlayerStats(headerArray, true);

        // get home team goalie stats
        GAME_DATA["homeTeamGoalieStats"] = extractHomeGoalieStats(headerArray, true);

        // // get away team stats
        GAME_DATA["awayTeamGameStats"] = extractAwayTeamData(headerArray);

        // // get away team player stats
        GAME_DATA["awayTeamPlayerStats"] = extractAwayPlayerStats(headerArray, true);

        // // get away team goalie stats
        GAME_DATA["awayTeamGoalieStats"] = extractAwayGoalieStats(headerArray, true);

        const headerArrayLength = headerArray.length;
        // // get goal scoring data for each goal scored
        GAME_DATA["allGoalsScored"] = extractGoalData(
          headerArray,
          headerArrayLength,
        );

        // // get penalty data for each penalty taken
        GAME_DATA["allPenalties"] = extractPenaltyData(
          headerArray,
          headerArrayLength
        );

        // get other game stats.
        GAME_DATA["otherGameStats"] = extractOtherGameStats(
          headerArray,
          seasonNumber,
          gameType,
          leagueName
        );
        ////////////////////////////////////////
        // object containing all the games data
        ////////////////////////////////////////
        //FIXME: in future remove tempCSVData as its for updating google sheets
        let gameProperties = {
          currSeason: seasonNumber,
          fileSize: d.byteLength,
          data: GAME_DATA,
          tempCSVData: headerArray
        };
        resolve(gameProperties);
      } catch (error) {
        let gameProperties = {
          message: "There was an error processing the file",
        };
        reject(gameProperties);
      }

  });
}

export default readOgRomBinaryGameState;