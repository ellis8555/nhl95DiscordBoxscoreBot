import getPointsPct from "./getPointsPct.js"

// update each team's standings object
export default function updateTeamObjects({ homeTeamObject, awayTeamObject, otherGameStats }) {
    const { homeTeam } = otherGameStats;

    // --- Handle tie game ---
    if (otherGameStats.wasGameATie) {
        homeTeamObject.T++;
        awayTeamObject.T++;
        homeTeamObject.Pts++;
        awayTeamObject.Pts++;
    } else {
        // --- Handle wins ---
        if (otherGameStats.winningTeam === homeTeam) {
            homeTeamObject.W++;
            homeTeamObject.Pts += 2;
        } else {
            awayTeamObject.W++;
            awayTeamObject.Pts += 2;
        }

        // --- Handle losses and OTL ---
        if (otherGameStats.losingTeam === homeTeam) {
            if (otherGameStats.overtimeRequired) {
                homeTeamObject.OTL++;
                homeTeamObject.Pts++;
            } else {
                homeTeamObject.L++;
            }
        } else {
            if (otherGameStats.overtimeRequired) {
                awayTeamObject.OTL++;
                awayTeamObject.Pts++;
            } else {
                awayTeamObject.L++;
            }
        }
    }

    // --- Calculate GP after all updates ---
    homeTeamObject.GP = homeTeamObject.W + homeTeamObject.L + homeTeamObject.OTL + homeTeamObject.T;
    awayTeamObject.GP = awayTeamObject.W + awayTeamObject.L + awayTeamObject.OTL + awayTeamObject.T;

    // --- Update points percentage ---
    homeTeamObject.Pct = getPointsPct(homeTeamObject.W, homeTeamObject.L, homeTeamObject.OTL, homeTeamObject.T);
    awayTeamObject.Pct = getPointsPct(awayTeamObject.W, awayTeamObject.L, awayTeamObject.OTL, awayTeamObject.T);
}