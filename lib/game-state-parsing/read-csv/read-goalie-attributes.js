// Function to read and process the CSV file using async/await

import fs from "node:fs/promises"
import path from "node:path"

async function readGoalieAttributes(leagueName, seasonNumber) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname).slice(1).replace(/\\/g, '/')
  const goalieCsvFile = `/csv/${leagueName}/${seasonNumber}/Goalie_Attributes.csv`;
  const filePath = decodeURIComponent(`${__dirname}${goalieCsvFile}`)

const goaliesArray = [];
const goaliesContainingObject = {};

  try {    
    const goalieAttributes = await fs.readFile(filePath, "utf-8");
       // Split the CSV data into rows
       const rows = goalieAttributes.split("\n").map((row) => row.trimEnd("\r"));
       // start at index one to skip headers
       for (let i = 1; i < rows.length; i++) {
         const row = rows[i].split(",");
   
         // Check if the row contains only commas
         if (row.join("").trim() === "") {
           // Skip this row as it's empty
           continue;
         }
         goaliesArray.push(row);
       }
   
       let curTeam = "";
       goaliesArray.forEach((goalieRow) => {
         if (goalieRow[1] !== curTeam) {
           curTeam = goalieRow[1];
           goaliesContainingObject[curTeam] = [goalieRow[0]];
         } else {
           goaliesContainingObject[curTeam].push(goalieRow[0]);
         }
       });
       return goaliesContainingObject;

  } catch (error) {
    console.log(error);
    return null;
  }
}

export default readGoalieAttributes;
