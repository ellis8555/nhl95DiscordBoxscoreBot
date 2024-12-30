function createGamesUniqueId(gameData, seasonNumber) {
  const key1 = gameData[0][1]; // Matchup
  const key2 = gameData[6][1]; // away attack
  const key3 = gameData[34][1]; // home attack
  const key4 = gameData[3][1]; // away shots
  const key5 = gameData[31][1]; // home shots
  const key6 = gameData[59][1]; // face offs
  const key7 = gameData[9][1]; // away checks
  const key8 = gameData[24][1]; // home checks
  const key9 = gameData[35][1]; // home score
  const key10 = gameData[7][1]; // away score
  const key11 = seasonNumber;

  return `${key11}${key1}${key2}${key3}${key9}${key4}${key5}${key6}${key7}${key8}${key10}`;
}

export default createGamesUniqueId;
