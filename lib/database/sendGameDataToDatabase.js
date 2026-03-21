async function sendGameDataToDatabase({league, isPlayoffs, coaches, romData, seeds}){

    try {
        const seasonNumber = romData.otherGameStats.seasonNumber
        const gameMode = isPlayoffs ? "playoff" : "season"
        // get team abbreviations
        const homeTeam = romData.otherGameStats.homeTeam
        const homeTeamSeed = seeds[homeTeam]
        const awayTeam = romData.otherGameStats.awayTeam
        const awayTeamSeed = seeds[awayTeam]
        // assign higher seeds
        let seedA, seedB;
        if (homeTeamSeed <= awayTeamSeed) {
            seedA = homeTeam;
            seedB = awayTeam;
        } else {
            seedA = awayTeam;
            seedB = homeTeam;
        }
        // get team scores
        const homeGoals = romData.homeTeamGameStats.HomeGOALS
        const awayGoals = romData.awayTeamGameStats.AwayGOALS
        // assign seed goals
        const seedAScore = seedA === homeTeam ? homeGoals : awayGoals;
        const seedBScore = seedB === homeTeam ? homeGoals : awayGoals;
        // was an OT game
        const overtime = romData.otherGameStats.overtimeRequired ? 1 : 0
        // get coaches
        const homeTeamCoachObject = coaches.find(coach => coach.team === homeTeam)
        const awayTeamCoachObject = coaches.find(coach => coach.team === awayTeam)
        const homeTeamCoach = homeTeamCoachObject.id
        const awayTeamCoach = awayTeamCoachObject.id

        // set objects to be sent as the body of the fetch request
        let dataToBeSentToDB
        const game = {}
        const teamStats = {}
        const scoring = []

        // teamStats
        const { homeTeamGameStats, awayTeamGameStats, otherGameStats, allGoalsScored } = romData
        teamStats["home_shots"] = homeTeamGameStats.HomeSHOTS
        teamStats["away_shots"] = awayTeamGameStats.AwaySHOTS
        teamStats["home_pp_g"] = homeTeamGameStats["HomePP GOALS"]
        teamStats["away_pp_g"] = awayTeamGameStats["AwayPP GOALS"]
        teamStats["home_pp_amt"] = homeTeamGameStats.HomePIM
        teamStats["away_pp_amt"] = awayTeamGameStats.AwayPIM
        teamStats["home_pp_shots"] = homeTeamGameStats["HomePP SHOTS"]
        teamStats["away_pp_shots"] = awayTeamGameStats["AwayPP SHOTS"]
        teamStats["home_pp_mins"] = homeTeamGameStats["HomePP MIN"]
        teamStats["away_pp_mins"] = awayTeamGameStats["AwayPP MIN"]
        teamStats["home_shg"] = homeTeamGameStats.HomeSHG
        teamStats["away_shg"] = awayTeamGameStats.AwaySHG
        teamStats["home_pens"] = homeTeamGameStats.HomePENALTIES
        teamStats["away_pens"] = awayTeamGameStats.AwayPENALTIES
        teamStats["home_pim"]=  homeTeamGameStats.HomePIM
        teamStats["away_pim"]=  awayTeamGameStats.AwayPIM
        teamStats["home_fow"] = homeTeamGameStats["HomeFACEOFFS WON"]
        teamStats["away_fow"] = awayTeamGameStats["AwayFACEOFFS WON"]
        teamStats["fo_total"] = homeTeamGameStats["HomeFACEOFFS WON"] + awayTeamGameStats["AwayFACEOFFS WON"]
        teamStats["home_chk"] = homeTeamGameStats.HomeCHECKS
        teamStats["away_chk"] = awayTeamGameStats.AwayCHECKS
        teamStats["home_attack"] = homeTeamGameStats.HomeATTACK
        teamStats["away_attack"] = awayTeamGameStats.AwayATTACK
        teamStats["home_pass_attempts"] = homeTeamGameStats["HomePASS ATT"]
        teamStats["away_pass_attempts"] = awayTeamGameStats["AwayPASS ATT"]
        teamStats["home_pass_complete"] = homeTeamGameStats["HomePASS COMP"]
        teamStats["away_pass_complete"] = awayTeamGameStats["AwayPASS COMP"]
        teamStats["home_break_attempts"] = homeTeamGameStats.HomeBREAKAWAY
        teamStats["away_break_attempts"] = awayTeamGameStats.AwayBREAKAWAY
        teamStats["home_break_goals"] = homeTeamGameStats["HomeBREAKAWAY GOALS"]
        teamStats["away_break_goals"] = awayTeamGameStats["AwayBREAKAWAY GOALS"]
        teamStats["home_1xa"] = homeTeamGameStats["Home1X ATT"]
        teamStats["away_1xa"] = awayTeamGameStats["Away1X ATT"]
        teamStats["home_1xg"] = homeTeamGameStats["Home1X GOALS"]
        teamStats["away_1xg"] = awayTeamGameStats["Away1X GOALS"]
        teamStats["home_ps"] = homeTeamGameStats["HomePENALTY SHOTS"]
        teamStats["away_ps"] = awayTeamGameStats["AwayPENALTY SHOTS"]
        teamStats["home_psg"] = homeTeamGameStats["HomePENALTY SHOT GOALS"]
        teamStats["away_psg"] = awayTeamGameStats["AwayPENALTY SHOT GOALS"]
        teamStats["home_1p_s"] = homeTeamGameStats["Home1ST SHOTS"]
        teamStats["away_1p_s"] = awayTeamGameStats["Away1ST SHOTS"]
        teamStats["home_2p_s"] = homeTeamGameStats["Home2ND SHOTS"]
        teamStats["away_2p_s"] = awayTeamGameStats["Away2ND SHOTS"]
        teamStats["home_3p_s"] = homeTeamGameStats["Home3RD SHOTS"]
        teamStats["away_3p_s"] = awayTeamGameStats["Away3RD SHOTS"]
        teamStats["home_ot_s"] = homeTeamGameStats["HomeOT SHOTS"]
        teamStats["away_ot_s"] = awayTeamGameStats["AwayOT SHOTS"]
        teamStats["home_1p_g"] = homeTeamGameStats["Home1ST GOALS"]
        teamStats["away_1p_g"] = awayTeamGameStats["Away1ST GOALS"]
        teamStats["home_2p_g"] = homeTeamGameStats["Home2ND GOALS"]
        teamStats["away_2p_g"] = awayTeamGameStats["Away2ND GOALS"] 
        teamStats["home_3p_g"] = homeTeamGameStats["Home3RD GOALS"]
        teamStats["away_3p_g"] = awayTeamGameStats["Away3RD GOALS"]
        teamStats["ot_flag"] = overtime
        teamStats["total_time"] = otherGameStats["GAME LENGTH"]     
        
        // scoring summary

        allGoalsScored.forEach(goal => {
            const goalData = {}
            goalData.period = goal.Period
            goalData.g_time = goal.TIME 
            goalData.g_team = goal.TEAM 
            goalData.goal_player_name = goal.GOALscorer 
            goalData.assist_primary_name = goal["ASSIST 1"]
            goalData.assist_secondary_name = goal["ASSIST 2"]
            goalData.score_type = goal.TYPE

            scoring.push(goalData)
        })

        if(gameMode === 'season'){
            // set game stats
            game["lg"] = `${league.toUpperCase()}${seasonNumber}`
            game["mode"] = gameMode
            game["home"] = homeTeam
            game["away"] = awayTeam
            game["coach_home"] = homeTeamCoach 
            game["coach_away"] = awayTeamCoach
            game["score_home"] = homeGoals,
            game["score_away"] = awayGoals,
            game["ot"] = overtime
    
            dataToBeSentToDB = {
                    game, 
                    teamStats,
                    scoring,
            }
        }

        if(gameMode === 'playoff'){
            dataToBeSentToDB = {
                "type": "playoff",
                "lg" : league.toUpperCase() + seasonNumber,
                "seed_a": Math.min(homeTeamSeed, awayTeamSeed),
                "seed_b": Math.max(homeTeamSeed, awayTeamSeed),
                "score_a": seedAScore,
                "score_b": seedBScore,
                "game_date": getLocalYYYYMMDD(),
                teamStats,
                scoring
            }
        }
        // send game data to be stored in the db
        const response = await fetch("https://gwaiwtgwdqadxmimiskf.supabase.co/functions/v1/process-game-state", {
            method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-webhook-secret": process.env.X_WEBHOOK_SECRET
            },
            body: JSON.stringify(dataToBeSentToDB)
        })

        if(!response.ok){
            throw new Error(`HTTP error ${response.status}: Supabase function failed. Talk to Puss!`);
        }

        const result = await response.json();

        // DB game insert/update
        if (!result.ok) {
        throw new Error("Game record failed to insert or update");
        }

        // team stats
        if (result.teamStats && !result.teamStats.ok) {
        throw new Error("Team stats failed to insert");
        }

        // scoring plays
        if (result.scoring && !result.scoring.ok) {
        throw new Error("Scoring plays failed to insert");
        }       

    } catch (error) {
        throw new Error(error.message)
    }

}

function getLocalYYYYMMDD() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

export default sendGameDataToDatabase