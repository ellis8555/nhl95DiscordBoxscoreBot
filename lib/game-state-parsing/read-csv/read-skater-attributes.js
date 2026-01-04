// Function to read and process the CSV file using async/await

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readSkatersAttributes(leagueName, seasonNumber) {
  // Build the file path relative to this JS file
  const filePath = path.join(
    __dirname,
    "csv",
    leagueName,
    String(seasonNumber),
    "Skater_Attributes.csv"
  );

  const skatersArray = [];
  const skatersContainingObject = {};

  try {
    // Read the CSV file
    const skatersAttributes = await fs.readFile(filePath, "utf-8");

    // Split CSV into rows
    const rows = skatersAttributes.split("\n").map(row => row.trimEnd());

    // Start at index 1 to skip headers
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");

      // Skip empty rows
      if (row.join("").trim() === "") continue;

      skatersArray.push(row);
    }

    // Group skaters by team
    let curTeam = "";
    skatersArray.forEach((skaterRow) => {
      if (skaterRow[1] !== curTeam) {
        curTeam = skaterRow[1];
        skatersContainingObject[curTeam] = [skaterRow[0]];
      } else {
        skatersContainingObject[curTeam].push(skaterRow[0]);
      }
    });

    return skatersContainingObject;

  } catch (error) {
    console.error("Failed to read skater attributes:", filePath);
    console.error(error);
    return null;
  }
}

export default readSkatersAttributes;

