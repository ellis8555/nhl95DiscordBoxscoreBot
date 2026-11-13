import {  pure_consts } from "../constants/consts.js";

async function mentionRemainingOpponents(
  seasonGamesChannelId,
  excludeCoaches = [],
  { server, client, coachId, teamCodes, messageId, userMessage, coaches, uniqueIdsFile }
) {
  const channel = client.channels.cache.get(seasonGamesChannelId);
  if (!channel) return;

  // Get the coach object for the requesting coach
  const coachObject = coaches.find(coach => coach.id === coachId);
  if (!coachObject) return;

  const pureServer = process.env.pureServer;

  // Determine how many games are required vs each opponent

  const gamesVsEachOpponent = pure_consts.p_games_vs_opponents;


  const coachName = coachObject.user;
  const teamAbbreviation = coachObject.team;

  // Track opponents already played
  const opponentsPlayed = [];
  const matchupPattern = /^[A-Z]{3}\/[A-Z]{3}$/;

  uniqueIdsFile
    .split(",")
    .filter(entry => matchupPattern.test(entry))
    .forEach(matchup => {
      if (matchup.includes(teamAbbreviation)) {
        const [team1, team2] = matchup.split("/");
        if (team1 !== teamAbbreviation) opponentsPlayed.push(team1);
        if (team2 !== teamAbbreviation) opponentsPlayed.push(team2);
      }
    });

  // Count how many games have been played vs each opponent
  const opponentsPlayedCount = {};
  opponentsPlayed.forEach(opponent => {
    opponentsPlayedCount[opponent] = (opponentsPlayedCount[opponent] || 0) + 1;
  });

  // Remove opponents who have already played all their games
  for (const [opponent, count] of Object.entries(opponentsPlayedCount)) {
    if (count >= gamesVsEachOpponent) {
      const index = teamCodes.indexOf(opponent);
      if (index !== -1) teamCodes.splice(index, 1);
    }
  }

  // Determine minimum number of remaining teams to check for "season complete"
  let leaguesTeamCodesFloor = 1;
  if (server === pureServer) {
    leaguesTeamCodesFloor = 26 - coaches.length + 1; // Pure league special case
  }

  if (teamCodes.length > leaguesTeamCodesFloor) {
    // Exclude coaches who should not be mentioned
    excludeCoaches.forEach(team => {
      const index = teamCodes.indexOf(team);
      if (index !== -1) teamCodes.splice(index, 1);
    });

    // Remove the calling coach's team
    const callingTeamIndex = teamCodes.indexOf(teamAbbreviation);
    if (callingTeamIndex !== -1) teamCodes.splice(callingTeamIndex, 1);

    let seasonGamesCall = "";
    teamCodes.forEach(opponent => {
      const coachObj = coaches.find(c => c.team === opponent);
      if (coachObj && coachObj.id !== coachId) {
        seasonGamesCall += coachObj.skipBeingMentioned === false
          ? `<@${coachObj.id}>`
          : `@${coachObj.user}`;
      }
    });

    if (seasonGamesCall.trim()) {
      await channel.send(seasonGamesCall);
    }
    
  } else {
    // Season complete message
      await channel.send(`${coachName} season is complete`);
  }
}

export default mentionRemainingOpponents;
