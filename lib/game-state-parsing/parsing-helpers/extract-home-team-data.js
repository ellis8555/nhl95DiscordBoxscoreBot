function extractHomeTeamData(gameData) {
  let homeTeamStatDetails = {};

  // home team is indexs are 2, 31-58

  homeTeamStatDetails[gameData[1][0]] = gameData[1][1];

  const homeTeamBeginningIndex = 31;
  const homeTeamEndingIndex = 58;

  const extractHomeTeamIndexes = [];
  for (let i = homeTeamBeginningIndex; i <= homeTeamEndingIndex; i++) {
    extractHomeTeamIndexes.push(gameData[i]);
  }

  for (let i = homeTeamBeginningIndex; i <= homeTeamEndingIndex; i++) {
    homeTeamStatDetails[gameData[i][0]] = gameData[i][1];
  }

  return homeTeamStatDetails;
}

export default extractHomeTeamData;
