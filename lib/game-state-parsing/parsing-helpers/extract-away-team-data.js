function extractAwayTeamData(gameData) {
  let awayTeamStatDetails = {};

  // away team is indexs are 2-30

  const awayTeamBeginningIndex = 2;
  const awayTeamEndingIndex = 30;

  const extractAwayTeamIndexes = [];
  for (let i = awayTeamBeginningIndex; i <= awayTeamEndingIndex; i++) {
    extractAwayTeamIndexes.push(gameData[i]);
  }

  for (let i = awayTeamBeginningIndex; i <= awayTeamEndingIndex; i++) {
    awayTeamStatDetails[gameData[i][0]] = gameData[i][1];
  }
  return awayTeamStatDetails;
}

export default extractAwayTeamData;
