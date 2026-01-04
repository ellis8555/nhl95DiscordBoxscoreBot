import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pure_consts } from "../constants/consts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
    listeningChannel,
    pureLeagueScoreExpression,
    editPermission,
    writeToGoogleSheets,
    currentSeason,
    appendGoogleSheets,
    teamCodesList,
} = pure_consts;

const { countRowRange } = appendGoogleSheets;
const { 
    col_start_search, 
    col_end_search,
    col_start_home,
    col_end_home,
    col_start_away,
    col_end_away 
} = appendGoogleSheets.rawSchedule;

const {
    raw_standings_col_start,
    streak_col
} = appendGoogleSheets.rawStandings;

async function processPure({ sheets, message }) {
    let pureScoreChannelId;
    let isEditForMentionOpponent = false; // if false, uniqueId's file will be updated

    try {
        // Get channel bot is listening to
        const channel = message.guild.channels.cache.find(channel => channel.name === listeningChannel);
        if (channel) {
            pureScoreChannelId = channel.id;
            if (message.channel.id !== pureScoreChannelId) return;
        } else {
            console.log(`Channel ${listeningChannel} not found.`);
            return;
        }

        // Check message for score format
        const getScore = message.content;
        const scorePatternTest = new RegExp(pureLeagueScoreExpression);
        const isInScoreFormat = scorePatternTest.test(getScore);
        if (!isInScoreFormat) return;

        const scoreParts = getScore.split(" ").filter(part => part !== "" && part !== "-");
        let isEntryAnEdit = false;

        // Check if this is an edit
        if (scoreParts[0] === "EDIT") {
            scoreParts.shift(); // remove "EDIT"
            const getAuthorId = message.author.id;
            const authorizedEditors = Object.values(editPermission);
            if (authorizedEditors.includes(getAuthorId)) {
                isEntryAnEdit = true;
                isEditForMentionOpponent = true;
            } else {
                throw new Error("Permission required to make edits.");
            }
        }

        let [homeTeam, homeTeamScore, awayTeam, awayTeamScore] = scoreParts;
        homeTeam = homeTeam.toUpperCase();
        awayTeam = awayTeam.toUpperCase();

        if (!teamCodesList.includes(homeTeam) || !teamCodesList.includes(awayTeam)) {
            throw new Error("Check the teams abbreviation as it needs to match from a list.");
        }

        if (+homeTeamScore > 50 || +awayTeamScore > 50) {
            throw new Error("Scores can't be higher than 50.");
        }

        const spreadsheetId = process.env.pureLeagueSpreadSheetId;
        let range = `RawSchedule!${countRowRange}`;

        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        if (res.status !== 200 || res.statusText !== "OK") {
            throw new Error("Error in reading RawSchedule sheet");
        }

        const rows = res.data.values;
        if (!rows || rows.length < 1) throw new Error("RawSchedule is empty.");

        let homeTeamRowNumber;
        let homeTeamRowNumberFound = false;

        for (let index = 0; index < rows.length; index++) {
            const game = rows[index];
            if (game[4] === currentSeason && game[8] === homeTeam && game[11] === awayTeam) {
                homeTeamRowNumber = index + 2;
                homeTeamRowNumberFound = true;
                break;
            }
        }

        if (!homeTeamRowNumber) throw new Error("This matchup was not found.");

        // Check if matchup already exists
        if (!isEntryAnEdit) {
            range = `RawSchedule!${col_start_search}${homeTeamRowNumber}:${col_end_search}${homeTeamRowNumber}`;
            const checkForPreviousResult = await sheets.spreadsheets.values.get({ spreadsheetId, range });
            if (checkForPreviousResult.data.values) {
                throw new Error(`This matchup may have occurred already. Check the sheet at line: ${homeTeamRowNumber}`);
            }
        }

        // Determine results
        let homeTeamResult, awayTeamResult;
        if (+homeTeamScore > +awayTeamScore) {
            homeTeamResult = "W";
            awayTeamResult = "L";
        } else if (+homeTeamScore < +awayTeamScore) {
            homeTeamResult = "L";
            awayTeamResult = "W";
        } else {
            homeTeamResult = "T";
            awayTeamResult = "T";
        }

        if (writeToGoogleSheets && homeTeamRowNumberFound) {
            const requests = [
                {
                    range: `RawSchedule!${col_start_home}${homeTeamRowNumber}:${col_end_home}${homeTeamRowNumber}`,
                    values: [[homeTeamResult, +homeTeamScore]],
                },
                {
                    range: `RawSchedule!${col_start_away}${homeTeamRowNumber}:${col_end_away}${homeTeamRowNumber}`,
                    values: [[awayTeamResult, +awayTeamScore]],
                }
            ];

            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: { data: requests, valueInputOption: "RAW" }
            });

            // ---- Update streaks in RawStandings ----
            // Fetch the standings
            range = `RawStandings!${raw_standings_col_start}:${streak_col}`;
            const standingsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range });
            if (standingsRes.status !== 200 || standingsRes.statusText !== "OK") {
                throw new Error("Error reading standings sheet to update streaks");
            }

            const rawStandingsData = standingsRes.data.values;
            let homeIndex, awayIndex;

            for (let i = 0; i < rawStandingsData.length; i++) {
                if (rawStandingsData[i][0] === currentSeason && rawStandingsData[i][3] === homeTeam) homeIndex = i + 1;
                if (rawStandingsData[i][0] === currentSeason && rawStandingsData[i][3] === awayTeam) awayIndex = i + 1;
                if (homeIndex && awayIndex) break;
            }

            const calculateNewStreak = (prev, result) => {
                if (!prev || prev === "-") return "1" + result;
                const len = prev.length;
                let length = len === 2 ? +prev[0] : +prev.slice(0, 2);
                let type = len === 2 ? prev[1] : prev[2];
                if (type === result) length += 1; else length = 1;
                return length.toString() + result;
            };

            const updatedHomeStreak = calculateNewStreak(rawStandingsData[homeIndex - 1][8], homeTeamResult);
            const updatedAwayStreak = calculateNewStreak(rawStandingsData[awayIndex - 1][8], awayTeamResult);

            const streakRequests = [
                { range: `RawStandings!${streak_col}${homeIndex}`, values: [[updatedHomeStreak]] },
                { range: `RawStandings!${streak_col}${awayIndex}`, values: [[updatedAwayStreak]] },
            ];

            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: { data: streakRequests, valueInputOption: "RAW" }
            });
        }

        // React success
        if (message) await message.react("✅");

        // Update uniqueIds for @mentioning opponents
        if (!isEditForMentionOpponent) {
            const filePath = path.join(__dirname, "..", "public", "pUniqueIds.csv");
            appendFileSync(filePath, `${homeTeam}/${awayTeam},`);
        }

    } catch (error) {
        await message.channel.send(`❌: ${error.message}`);
    }
}

export default processPure;
