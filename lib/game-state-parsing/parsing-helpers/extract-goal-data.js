function extractGoalData(gameData, gameDataLength) {
  // get indexes for all goals scored in the game
  const extractGoalIndexes = [];
  for (let i = 0; i < gameDataLength; i++) {
    if (gameData[i][0] === "Goal#" && gameData[i][1] !== "-") {
      extractGoalIndexes.push(i);
    }
  }

  const goalCount = extractGoalIndexes.length;
  const allGoalsScored = [];

  for (let i = 0; i < goalCount; i++) {
    let goalDetails = {};
    const beginningIndex = extractGoalIndexes[i];
    const endingIndex = beginningIndex + 7;

    for (let j = beginningIndex; j <= endingIndex; j++) {
      goalDetails[gameData[j][0]] = gameData[j][1];
    }

    allGoalsScored.push(goalDetails);
  }

  return allGoalsScored;
}

export default extractGoalData;
