// Function to read and process the CSV file using async/await

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Convert ES module URL to a proper path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readTeamPositionCounts(leagueName, seasonNumber) {
  // Build the file path relative to this JS file
  const filePath = path.join(
    __dirname,
    "csv",
    leagueName,
    String(seasonNumber),
    "Team_Position_Counts.csv"
  );

  const teamsArray = [];
  const teamsContainingObject = {};

  try {
    // Read the CSV file
    const teamsAttributes = await fs.readFile(filePath, "utf-8");

    // Split CSV into rows
    const rows = teamsAttributes.split("\n").map(row => row.trimEnd());

    // Start at index 1 to skip headers
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");

      // Skip empty rows
      if (row.join("").trim() === "") continue;

      teamsArray.push(row);
    }

    // Map team data
    teamsArray.forEach((teamRow) => {
      teamsContainingObject[teamRow[0]] = {
        goalies: teamRow[1],
        forwards: teamRow[2],
        defensemen: teamRow[3]
      };
    });

    return teamsContainingObject;

  } catch (error) {
    console.error("Failed to read team position counts:", filePath);
    console.error(error);
    return null;
  }
}

export default readTeamPositionCounts;

