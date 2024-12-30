function extractPenaltyData(gameData, gameDataLength) {
  // get indexes for all penalties taken in the game
  const extractPenaltyIndexes = [];
  for (let i = 0; i < gameDataLength; i++) {
    if (gameData[i][0] === "Pen#" && gameData[i][1] !== "-") {
      extractPenaltyIndexes.push(i);
    }
  }

  const penaltyCount = extractPenaltyIndexes.length;

  // place all penalty stat objects into an array
  const allPenaltiesTaken = [];

  for (let i = 0; i < penaltyCount; i++) {
    let penaltyDetails = {};
    const beginningIndex = extractPenaltyIndexes[i];
    const endingIndex = beginningIndex + 5;

    for (let j = beginningIndex; j <= endingIndex; j++) {
      penaltyDetails[gameData[j][0]] = gameData[j][1];
    }

    allPenaltiesTaken.push(penaltyDetails);
  }

  return allPenaltiesTaken;
}

export default extractPenaltyData;
