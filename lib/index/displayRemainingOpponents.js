import path from "node:path";
import { AttachmentBuilder } from "discord.js";
import generateRemainingOpponentsImage from "../canvas/generateRemainingOpponentsImage.js";
import { bot_consts, q_bot_consts } from "../constants/consts.js";

async function displayRemainingOpponents(
  seasonGamesChannelId,
  excludeCoaches = [],
  { server, client, teamAbbreviation, teamCodes, coaches, uniqueIdsFile }
) {
  const channel = client.channels.cache.get(seasonGamesChannelId);
  if (!channel) return;

  // Return if the 3-letter abbreviation doesn't represent a team
  if (!teamCodes.includes(teamAbbreviation)) {
    const ignoredAbbreviations = ["ROM", "GDI", "FYI", "PYG", "GTG"];
    if (ignoredAbbreviations.includes(teamAbbreviation)) return;
    await channel.send("Team abbreviation not found");
    return;
  }

  // Determine games required vs each opponent depending on server
  let gamesVsEachOpponent;
  if (server === process.env.server) {
    gamesVsEachOpponent = bot_consts.w_games_vs_opponents;
  } else if (server === process.env.qServer) {
    gamesVsEachOpponent = q_bot_consts.q_games_vs_opponents;
  } else {
    throw new Error("Unknown server for remaining opponents calculation");
  }

  // Track opponents already played
  const opponentsPlayed = [];
  const matchupPattern = /^[A-Z]{3}\/[A-Z]{3}$/;

  uniqueIdsFile
    .split(",")
    .filter(entry => matchupPattern.test(entry))
    .forEach(matchup => {
      if (matchup.includes(teamAbbreviation)) {
        const teamsMatch = matchup.split("/");
        teamsMatch.forEach(team => {
          if (team !== teamAbbreviation) opponentsPlayed.push(team);
        });
      }
    });

  // Count how many games have been played vs each opponent
  const opponentsPlayedCount = {};
  opponentsPlayed.forEach(opponent => {
    opponentsPlayedCount[opponent] = (opponentsPlayedCount[opponent] || 0) + 1;
  });

  // Determine opponents who still have games left
  const sortedOpponentsPlayedCount = Object.keys(opponentsPlayedCount).sort();
  const sortedGamesPlayed = {};
  sortedOpponentsPlayedCount.forEach(team => {
    if (opponentsPlayedCount[team] < gamesVsEachOpponent) {
      sortedGamesPlayed[team] = opponentsPlayedCount[team];
    }
  });

  // Remove opponents who have completed all games
  for (const [opponent, count] of Object.entries(opponentsPlayedCount)) {
    if (count === gamesVsEachOpponent) {
      const index = teamCodes.indexOf(opponent);
      if (index !== -1) teamCodes.splice(index, 1);
    }
  }

  // Remove excluded coaches from the list
  excludeCoaches.forEach(team => {
    const index = teamCodes.indexOf(team);
    if (index !== -1) teamCodes.splice(index, 1);
  });

  // Remove the calling team's abbreviation
  const callingTeamIndex = teamCodes.indexOf(teamAbbreviation);
  if (callingTeamIndex !== -1) teamCodes.splice(callingTeamIndex, 1);

  // If there are opponents remaining
  if (teamCodes.length > 0) {
    const fullSeriesGamesRemaining = teamCodes.length * gamesVsEachOpponent;
    const partialSeriesGamesPlayed = Object.values(sortedGamesPlayed).reduce(
      (sum, val) => sum + val,
      0
    );
    const gamesRemaining = fullSeriesGamesRemaining - partialSeriesGamesPlayed;

    // Generate image of remaining opponents
    const remainingOpponentsImage = await generateRemainingOpponentsImage({
      gamesVsEachOpponent,
      teamCodes,
      sortedGamesPlayed
    });

    const attachment = new AttachmentBuilder(Buffer.from(remainingOpponentsImage), {
      name: "opponents.png"
    });

    const coach = coaches.find(c => c.team === teamAbbreviation);
    await channel.send({
      content: `\`${coach.user} remaining opponents\``,
      files: [attachment]
    });
    await channel.send(`\`Games remaining: ${gamesRemaining}\``);
  } else {
    // Season complete
    const coach = coaches.find(c => c.team === teamAbbreviation);
    await channel.send(`<:${coach.emojiName}:${coach.emojiId}>\n${teamAbbreviation} season is complete.`);
  }
}

export default displayRemainingOpponents;
