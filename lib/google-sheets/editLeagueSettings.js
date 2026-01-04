import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bot_consts } from "../constants/consts.js";

// Convert ES module URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { channelsRange, coachesStartRange, coachesEndRange, bsbSheetName, romTeamOrderList, coachesEndColumn } = bot_consts.appendGoogleSheets.bsbSettings;

async function editLeagueSettings({ sheets }) {
  try {
    const spreadsheetId = process.env.spreadSheetId;

    // Get end range of coaches list
    const range = `${bsbSheetName}!${coachesEndRange}`;
    let updateCoachesEndRange = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const { values } = updateCoachesEndRange.data;
    updateCoachesEndRange = values.flat()[0];

    // Ranges for all settings
    let ranges = [
      `${bsbSheetName}!${romTeamOrderList}`,
      `${bsbSheetName}!${channelsRange}`,
      `${bsbSheetName}!${coachesStartRange}:${coachesEndColumn}${updateCoachesEndRange}`,
    ];

    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    if (res.status !== 200 || res.statusText !== "OK") {
      throw new Error("Error in reading BSB settings sheet");
    }

    // ✅ Build file path relative to this JS file
    const filePath = path.join(__dirname, "..", "..", "public", "json", "bot_constants.json");
    const file = readFileSync(filePath, "utf-8");
    const w_settings = JSON.parse(file);

    let [romTeamOrder, channelSettings, coachDetails] = res.data.valueRanges;

    // Update ROMs team order list
    romTeamOrder = romTeamOrder.values[0][0];
    const teamsPattern = /([A-Z]{3})/g;
    const teamsAbbreviations = romTeamOrder.match(teamsPattern);

    // Update channel settings
    channelSettings = Object.fromEntries(channelSettings.values);

    // Update coach objects
    coachDetails = coachDetails.values;
    const teamCount = teamsAbbreviations.length;
    const coachCount = coachDetails.length;

    if (teamCount !== coachCount) {
      throw new Error(
        `${teamCount} - .py file teams\n${coachCount} - coaches in sheets\nThese counts need to match. One coach per team in .py file`
      );
    }

    const updatedCoaches = [];
    coachDetails.forEach(coach => {
      let [discordName, discordId, team, emojiId, emojiName] = coach;
      const upperCaseTeam = team.toUpperCase();
      const doesTeamExist = teamsAbbreviations.includes(upperCaseTeam);
      const getCoachObject = w_settings.coaches.find(prevCoach => prevCoach.id === discordId);
      const skipMention = getCoachObject?.skipBeingMentioned ?? false;

      if (!doesTeamExist) {
        throw new Error(`${team} is not found in list of team abbreviations from .py file listing`);
      }

      const coachObj = {
        id: discordId,
        user: discordName,
        team: upperCaseTeam,
        emojiId,
        emojiName,
        skipBeingMentioned: skipMention,
      };
      updatedCoaches.push(coachObj);
    });

    // Update settings
    w_settings.saveStatesListeningChannel = channelSettings['Save states channel'];
    w_settings.boxscoreOutputChannel = channelSettings['Boxscore channel'];
    w_settings.seasonGamesChannel = channelSettings['Season games channel'];
    w_settings.adminsListeningChannel = channelSettings['Admin BSB channel'];
    w_settings.saveStatePattern = `^${channelSettings['ROM save state name']}.*\\.state\\d{1,3}$`;
    w_settings.seasonNum = channelSettings['Season number'];
    w_settings.pauseWLeague = JSON.parse(channelSettings['Pause state uploads'].toLowerCase());
    w_settings.allowDuplicates = JSON.parse(channelSettings['Allow game state duplicates'].toLowerCase());
    w_settings.writeToUniqueIdsFile = JSON.parse(channelSettings['Write games Id to file'].toLowerCase());
    w_settings.writeToGoogleSheets = JSON.parse(channelSettings['Write to google sheets'].toLowerCase());
    w_settings.teamCodes = teamsAbbreviations;
    w_settings.coaches = updatedCoaches;

    // Set coaches to exclude
    if (channelSettings['Wipe games list'] === "") {
      w_settings.excludeCoaches = [];
    } else {
      w_settings.excludeCoaches = channelSettings['Wipe games list'].split(",").map(item => item.trim().toUpperCase());
    }

    // Reset remaining games if needed
    const resetRemainingGames = JSON.parse(channelSettings['Reset remaining games'].toLowerCase());
    if (resetRemainingGames) w_settings.remainingGames = [];

    // Write updated settings back
    writeFileSync(filePath, JSON.stringify(w_settings, null, 2), "utf-8");
    return 'League settings have been adjusted';
  } catch (error) {
    return error.message;
  }
}

export default editLeagueSettings;
