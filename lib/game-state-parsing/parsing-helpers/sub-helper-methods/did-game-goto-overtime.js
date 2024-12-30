function didGameGotoOvertime(gameLength) {
  const removeColon = gameLength.split(":");
  const gameTimeString = removeColon[0] + removeColon[1];

  const gameTime = parseInt(gameTimeString);

  if (gameTime > 1500) {
    return true;
  }

  return false;
}

export default didGameGotoOvertime;
