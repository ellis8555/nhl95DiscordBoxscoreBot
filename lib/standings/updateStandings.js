import fs from "node:fs"
import path from "node:path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import sortStandings from "./sortStandings.js"
import updateTeamStandingObjects from "./updateTeamStandingObjects.js"

export default function updateStandings({data}){
    const otherGameStats = data.otherGameStats
    const {homeTeam, awayTeam} = data.otherGameStats

    const wStandingsFilePath = path.join(__dirname, "..", "..", "public", "json", "standings", "w_standings.json")
    const readWStandingsFile = fs.readFileSync(wStandingsFilePath, "utf-8")
    
    // check for beginning of new season where the standings json file will be empty
    // if empty then populate the array via fetching all the coaches from the leagues constants.json file
    if(!readWStandingsFile.trim()){
        const wFilePath = path.join(__dirname, "..", "..", "public", "json", "bot_constants.json")
        const readWFile = fs.readFileSync(wFilePath, "utf-8")
        const w_bot_consts = JSON.parse(readWFile);
        const getCoaches = w_bot_consts.coaches
        
        // create a clean standings array with each teams object
        const newStandings = []
        getCoaches.forEach(coach => {
        const teamObject = {}
        teamObject.teamName = coach.team
        teamObject.GP = 0
        teamObject.W = 0
        teamObject.L = 0
        teamObject.T = 0
        teamObject.OTL = 0
        teamObject.Pts = 0
        teamObject.Pct = ".000"

        newStandings.push(teamObject)
        });

        const homeTeamObject = newStandings.find(team => team.teamName === homeTeam)
        const awayTeamObject = newStandings.find(team => team.teamName === awayTeam)

        updateTeamStandingObjects({homeTeamObject, awayTeamObject, otherGameStats})

        // sort the standings
        const sortedStandings = sortStandings(newStandings)
        sortedStandings.forEach((standing, index) => standing.seed = index+=1)
        fs.writeFileSync(wStandingsFilePath, JSON.stringify(sortedStandings, null, 2))
    } else {
        // at least one state has been submitted and the standings have been populated
        const standingsArray = JSON.parse(readWStandingsFile);
        const homeTeamObject = standingsArray.find(team => team.teamName === homeTeam)
        const awayTeamObject = standingsArray.find(team => team.teamName === awayTeam)        
        
        updateTeamStandingObjects({homeTeamObject, awayTeamObject, otherGameStats})
        // sort the standings
        const sortedStandings = sortStandings(standingsArray)
        sortedStandings.forEach((standing, index) => standing.seed = index+=1)
        fs.writeFileSync(wStandingsFilePath, JSON.stringify(sortedStandings, null, 2))
    }
}

