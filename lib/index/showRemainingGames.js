import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bot_consts } from "../constants/consts.js";

// Convert ES module URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function showRemainingGames(channelId, { client, coachId, leagueName, messageContent }) {
  const channel = client.channels.cache.get(channelId);
  if (!channel) return;

  try {
    // Only handling 'W' league for now
    if (leagueName !== "W") return;

    const uniqueIdFileName = "wUniqueIds.csv";
    const leagueConstsFileName = "bot_constants.json";

    const { teamCodes, coaches, w_games_vs_opponents, excludeCoaches, remainingGames: leagueGamesRemainingRaw } = bot_consts;
    const teamsList = [...teamCodes];
    const playersToIgnore = excludeCoaches;
    const gamesPlayedVsOpponents = w_games_vs_opponents;
    const teamsCount = teamCodes.length;
    const leagueGamesRemaining = leagueGamesRemainingRaw || [];

    // Read games played
    const uniqueIdFilePath = path.join(__dirname, "..", "public", uniqueIdFileName);
    const gameData = readFileSync(uniqueIdFilePath, "utf-8");
    const gamesPlayedArray = gameData.match(/([A-Z]{3}\/[A-Z]{3})/g) || [];
    const duplicatesRemovedGamesPlayedArray = Array.from(new Set(gamesPlayedArray));

    // Calculate total games
    const totalLeagueGamesToBePlayed =
      ((teamsCount - playersToIgnore.length) * ((teamsCount - playersToIgnore.length - 1) * gamesPlayedVsOpponents)) / 2;

    // Remove ignored players from duplicates array
    for (let i = duplicatesRemovedGamesPlayedArray.length - 1; i >= 0; i--) {
      const [team1, team2] = duplicatesRemovedGamesPlayedArray[i].split("/");
      if (playersToIgnore.includes(team1) || playersToIgnore.includes(team2)) {
        duplicatesRemovedGamesPlayedArray.splice(i, 1);
      }
    }

    const gamesRemainingToBePlayed = totalLeagueGamesToBePlayed - duplicatesRemovedGamesPlayedArray.length;

    // If >50 games remaining
    if (gamesRemainingToBePlayed > 50) {
      await channel.send(`\`${gamesRemainingToBePlayed}\` games left to be played`);
    }

    // If <=50 games remaining
    if (gamesRemainingToBePlayed > 0 && gamesRemainingToBePlayed <= 50) {
      if (leagueGamesRemaining.length > 0) {
        leagueGamesRemaining.sort((a, b) => a.localeCompare(b));
        let scheduleResponse = "";
        leagueGamesRemaining.forEach((matchup) => {
          const [homeTeam, awayTeam] = matchup.split("/");
          const homeCoach = coaches.find((c) => c.team === homeTeam);
          const awayCoach = coaches.find((c) => c.team === awayTeam);
          scheduleResponse += `<:${homeCoach.emojiName}:${homeCoach.emojiId}> vs <:${awayCoach.emojiName}:${awayCoach.emojiId}> : ${homeCoach.user} - ${awayCoach.user}\n`;
        });
        scheduleResponse += `\`${gamesRemainingToBePlayed}\` remaining matchups to be played`;
        await channel.send(scheduleResponse);
      } else {
        // Calculate remaining matchups dynamically
        let remainingMatchUps = [];

        playersToIgnore.forEach((player) => {
          const idx = teamsList.indexOf(player);
          if (idx !== -1) teamsList.splice(idx, 1);
        });

        const remainingGamesSchedule = {};
        teamsList.forEach((team) => {
          remainingGamesSchedule[team] = { homeGames: [...teamsList] };
          const selfIndex = remainingGamesSchedule[team].homeGames.indexOf(team);
          if (selfIndex !== -1) remainingGamesSchedule[team].homeGames.splice(selfIndex, 1);
        });

        duplicatesRemovedGamesPlayedArray.forEach((match) => {
          const [homeTeam, awayTeam] = match.split("/");
          const oppIndex = remainingGamesSchedule[homeTeam].homeGames.indexOf(awayTeam);
          if (oppIndex !== -1) remainingGamesSchedule[homeTeam].homeGames.splice(oppIndex, 1);
        });

        for (const team in remainingGamesSchedule) {
          remainingGamesSchedule[team].homeGames.forEach((opponent) => {
            remainingMatchUps.push(`${team}/${opponent}`);
          });
        }

        try {
          const filePath = path.join(__dirname, "..", "public", "json", leagueConstsFileName);
          const constsFile = readFileSync(filePath, "utf-8");
          const constsData = JSON.parse(constsFile);
          constsData.remainingGames = [...remainingMatchUps];
          writeFileSync(filePath, JSON.stringify(constsData, null, 2), "utf-8");
        } catch (error) {
          throw new Error(`Error trying to write remaining matchups to ${leagueConstsFileName}`);
        }

        let scheduleResponse = "";
        remainingMatchUps.forEach((matchup) => {
          const [homeTeam, awayTeam] = matchup.split("/");
          const homeCoach = coaches.find((c) => c.team === homeTeam);
          const awayCoach = coaches.find((c) => c.team === awayTeam);
          scheduleResponse += `<:${homeCoach.emojiName}:${homeCoach.emojiId}> vs <:${awayCoach.emojiName}:${awayCoach.emojiId}> : ${homeCoach.user} - ${awayCoach.user}\n`;
        });
        scheduleResponse += `\`${gamesRemainingToBePlayed}\` remaining matchups to be played`;
        await channel.send(scheduleResponse);
      }
    }

    // All games complete
    if (gamesRemainingToBePlayed === 0) {
      await channel.send("All games complete");
    }
  } catch (error) {
    await channel.send(error.message);
  }
}

export default showRemainingGames;
