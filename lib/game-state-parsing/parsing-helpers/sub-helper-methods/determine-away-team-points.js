function determineAwayTeamPoints(gameData, overtime) {
  const homeTeamScore = +gameData[35][1];
  const awayTeamScore = +gameData[7][1];
  if (homeTeamScore == awayTeamScore) {
    return 1;
  } else if (homeTeamScore < awayTeamScore) {
    return 2;
  } else if (homeTeamScore > awayTeamScore && overtime) {
    return 1;
  } else {
    return 0;
  }
}

export default determineAwayTeamPoints;
