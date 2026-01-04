import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readGoalieAttributes(leagueName, seasonNumber) {
  const filePath = path.join(
    __dirname,
    "csv",
    leagueName,
    String(seasonNumber),
    "Goalie_Attributes.csv"
  );

  const goaliesArray = [];
  const goaliesContainingObject = {};

  try {
    const goalieAttributes = await fs.readFile(filePath, "utf-8");

    const rows = goalieAttributes
      .split("\n")
      .map(row => row.trimEnd());

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");
      if (row.join("").trim() === "") continue;
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
    console.error("Failed to read goalie attributes:", filePath);
    console.error(error);
    return null;
  }
}

export default readGoalieAttributes;

