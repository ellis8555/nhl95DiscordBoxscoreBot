import getPointsPct from "./getPointsPct.js"

// update each teams standings object
export default function updateTeamObjects({homeTeamObject, awayTeamObject, otherGameStats}){
        const {homeTeam} = otherGameStats
        // update each teams standings categories within their object
        homeTeamObject.GP++
        awayTeamObject.GP++

        // tie game?
        if(otherGameStats.wasGameATie){
            homeTeamObject.T++
            awayTeamObject.T++
            homeTeamObject.Pts++
            awayTeamObject.Pts++
        }

        // adjust wins
        if(!otherGameStats.wasGameATie){
            if(otherGameStats.winningTeam === homeTeam){
                homeTeamObject.W++
                homeTeamObject.Pts +=2
            } else {
                awayTeamObject.W++
                awayTeamObject.Pts +=2                
            }
        } 

        // adjust loss
        if(!otherGameStats.wasGameATie){
            if(otherGameStats.losingTeam === homeTeam){
                if(!otherGameStats.overtimeRequired){
                    homeTeamObject.L++
                }
                if(otherGameStats.overtimeRequired){
                    homeTeamObject.Pts++
                    homeTeamObject.OTL++
                }
            } else {
                if(!otherGameStats.overtimeRequired){
                    awayTeamObject.L++
                }
                if(otherGameStats.overtimeRequired){
                    awayTeamObject.Pts++
                    awayTeamObject.OTL++
                }                
            }
        } 
        
        // points percentage homeTeam
        homeTeamObject.Pct = getPointsPct(homeTeamObject.W, homeTeamObject.L, homeTeamObject.OTL, homeTeamObject.T)
        
        // points percentage awayTeam
        awayTeamObject.Pct = getPointsPct(awayTeamObject.W, awayTeamObject.L, awayTeamObject.OTL, awayTeamObject.T)
}