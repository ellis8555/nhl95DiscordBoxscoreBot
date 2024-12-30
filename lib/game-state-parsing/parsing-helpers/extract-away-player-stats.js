function extractAwayPlayerStats(gameData, isOriginalRom = false) {
      // away players are from indexs 92-201 on custom rom
  // away players on original rom are from indexs 107-348

  const awayGoalieIndexBegin = isOriginalRom ? 107 : 92;
  const awayGoalieIndexEnd = isOriginalRom ? 348 : 201;

  // get indexes away players
  const extractPlayerIndexes = [];
  for (let i = awayGoalieIndexBegin; i <= awayGoalieIndexEnd; i++) {
    if (gameData[i][0] === "Name") {
      extractPlayerIndexes.push(i);
    }
  }
  const playerCount = extractPlayerIndexes.length;
  // put each players stats into an array
  const allAwayPlayerStats = [];
  for (let i = 0; i < playerCount; i++) {
    let playerDetails = {};
    const beginningIndex = extractPlayerIndexes[i];
    const endingIndex = beginningIndex + 10;
    for (let j = beginningIndex; j <= endingIndex; j++) {
      playerDetails[gameData[j][0]] = gameData[j][1];
    }
    allAwayPlayerStats.push(playerDetails);
  }
  return allAwayPlayerStats;
}

export default extractAwayPlayerStats;
