// Function to read and process the CSV file using async/await

import fs from "node:fs/promises"
import path from "node:path"

async function readSkatersAttributes(leagueName, seasonNumber) {
    const __dirname = path.dirname(new URL(import.meta.url).pathname).slice(1).replace(/\\/g, '/')
    const skaterCsvFile = `/csv/${leagueName}/${seasonNumber}/Skater_Attributes.csv`;
    const filePath = decodeURIComponent(`${__dirname}${skaterCsvFile}`)

  const skatersArray = [];
  const skatersContainingObject = {};

  try {

    const skatersAttributes = await fs.readFile(filePath, "utf-8");

    // Split the CSV data into rows
    const rows = skatersAttributes.split("\n").map((row) => row.trimEnd("\r"));
    // start at index one to skip headers
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");

      // Check if the row contains only commas
      if (row.join("").trim() === "") {
        // Skip this row as it's empty
        continue;
      }
      skatersArray.push(row);
    }

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
    console.error("There was a problem with the fetch operation:", error);
  }
}

export default readSkatersAttributes;
