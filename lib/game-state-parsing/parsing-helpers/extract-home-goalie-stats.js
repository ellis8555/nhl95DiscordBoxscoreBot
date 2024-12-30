// boolean arg set different indexes that the data is stored in
// the original rom has more players therefore increasing the array size

function extractHomeGoalieStats(gameData, isOriginalRom = false) {
  // home goalies are from indexs 202-231 on custom rom
  // home goalies on original rom are from indexs 349-393

  const homeGoalieIndexBegin = isOriginalRom ? 349 : 202;
  const homeGoalieIndexEnd = isOriginalRom ? 393 : 231;

  // get indexes the away goalies
  const extractPlayerIndexes = [];
  for (let i = homeGoalieIndexBegin; i <= homeGoalieIndexEnd; i++) {
    if (gameData[i][0] === "Name") {
      extractPlayerIndexes.push(i);
    }
  }
  const playerCount = extractPlayerIndexes.length;
  // put each goalies stats into an array
  const allHomeGoalieStats = [];
  for (let i = 0; i < playerCount; i++) {
    let goalieDetails = {};
    const beginningIndex = extractPlayerIndexes[i];
    const endingIndex = beginningIndex + 14;
    for (let j = beginningIndex; j <= endingIndex; j++) {
      goalieDetails[gameData[j][0]] = gameData[j][1];
    }
    allHomeGoalieStats.push(goalieDetails);
  }
  return allHomeGoalieStats;
}

export default extractHomeGoalieStats;
