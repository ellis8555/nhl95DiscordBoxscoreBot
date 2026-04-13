import fs from "node:fs"
import path from "node:path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import sortStandings from "./sortStandings.js"
import updateTeamStandingObjects from "./updateTeamStandingObjects.js"

export default async function updateStandings({data}){
    const otherGameStats = data.otherGameStats
    const {homeTeam, awayTeam, seasonNumber} = data.otherGameStats

    // get w league standings files
    const wStandingsFilePath = path.join(__dirname, "..", "..", "public", "json", "standings", "w_standings.json")
    const readWStandingsFile = fs.readFileSync(wStandingsFilePath, "utf-8")
    // get w league playoffss files
    const wPlayoffsFilePath = path.join(__dirname, "..", "..", "public", "json", "standings", "w_playoffs.json")
    const readWPlayoffsFile = fs.readFileSync(wPlayoffsFilePath, "utf-8")
    
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

        // update playoff seeds on file
        // create a clean standings array with each teams object
        const updatedSeeds = {}
        sortedStandings.forEach(standing => {
            updatedSeeds[standing.teamName] = standing.seed 
        });
        const { playoffTree } = JSON.parse(readWPlayoffsFile)
        const updatedPlayoffsFile = {
            "seeds" : updatedSeeds,
            playoffTree
        }
        fs.writeFileSync(wPlayoffsFilePath, JSON.stringify(updatedPlayoffsFile, null, 2))
    } else {
        // at least one state has been submitted and the standings have been populated
        try {
            const response = await fetch("https://gwaiwtgwdqadxmimiskf.supabase.co/functions/v1/compute-standings", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": process.env.DB_AUTH
                },
                body: JSON.stringify({
                    league: `W${seasonNumber}`
                })
            })
            if(!response.ok){
                throw new Error('Error in fetching the standings from supabase')
            }
            const standingsAPI = await response.json()
            const {standings} = standingsAPI
            // array that will hold the leagues standings
            let updatedStandings = []
            // object that hold in order teamName -> rank from first to last
            const updatedSeeds = {}
            const bySeedTeamname = {}
            standings.forEach(standing => {
                const standingObj = {}
                standingObj.teamName = standing.team
                standingObj.GP = standing.gp
                standingObj.W = standing.w
                standingObj.L = standing.l
                standingObj.T = standing.t
                standingObj.OTL = standing.otl
                standingObj.Pts = standing.pts
                standingObj.Pct = standingObj.Pct = ((p) => p === 1 ? "1.000" : p === 0 ? ".000" : p.toFixed(3).replace(/^0/, ''))(standing.pts_pct)
                standingObj.seed = standing.rank
                updatedStandings.push(standingObj)
                updatedSeeds[standing.team] = standing.rank
                bySeedTeamname[standing.rank] = standing.team
            })
            fs.writeFileSync(wStandingsFilePath, JSON.stringify(updatedStandings, null, 2))    
            
            // update playoff seeds on file
            const parsePlayoffFile = JSON.parse(readWPlayoffsFile)
            const { playoffTree } = parsePlayoffFile
            const updatedPlayoffsFile = {
                "seeds" : updatedSeeds,
                "reverseSeeds": bySeedTeamname,
                playoffTree
            }
            fs.writeFileSync(wPlayoffsFilePath, JSON.stringify(updatedPlayoffsFile, null, 2))
        } catch (error) {
            const wStandingsLogFilePath = path.join(__dirname, "..", "..", "public", "logs", "w_standings.log")
            const logEntry = `
                [${new Date().toISOString()}]
                Stack: ${error.stack}
                `
            fs.writeFileSync(wStandingsLogFilePath, logEntry, {
                flag: "a"
            })
        }
    }
}

