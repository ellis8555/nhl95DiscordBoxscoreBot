export default function getPointsPct(wins, losses, otLosses, ties) {
  const totalGames = wins + losses + otLosses + ties;

  if (totalGames === 0) return ".000";

  const pointsEarned = (2 * wins) + ties + otLosses;
  const maxPoints = 2 * totalGames;

  const pct = pointsEarned / maxPoints;
  const formatted = pct.toFixed(3);

  // keep 1.000, trim leading 0 otherwise
  return formatted === "1.000" ? formatted : formatted.substring(1);
}