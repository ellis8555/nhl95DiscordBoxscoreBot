function extractAwayGoalieStats(gameData, isOriginalRom = false) {
    // away goalies are from indexs 62-91 on custom rom
  // away goalies on original rom are from indexs 62-106

  const awayGoalieIndexBegin = 62;
  const awayGoalieIndexEnd = isOriginalRom ? 106 : 91;

  // get indexes away goalies
  const extractPlayerIndexes = [];
  for (let i = awayGoalieIndexBegin; i <= awayGoalieIndexEnd; i++) {
    if (gameData[i][0] === "Name") {
      extractPlayerIndexes.push(i);
    }
  }
  const playerCount = extractPlayerIndexes.length;
  // put each goalies stats into an array
  const allAwayGoalieStats = [];
  for (let i = 0; i < playerCount; i++) {
    let goalieDetails = {};
    const beginningIndex = extractPlayerIndexes[i];
    const endingIndex = beginningIndex + 14;
    for (let j = beginningIndex; j <= endingIndex; j++) {
      goalieDetails[gameData[j][0]] = gameData[j][1];
    }
    allAwayGoalieStats.push(goalieDetails);
  }
  return allAwayGoalieStats;
}

export default extractAwayGoalieStats;
