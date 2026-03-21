export default function sortStandings(standings){
    standings.sort((a, b) => {
        // First, sort by 'Pts' property in descending order
        if (b.Pts - a.Pts !== 0) {
            return b.Pts - a.Pts;
            } else if (b.GP - a.GP !== 0) {
            // if teams are tied with games played then sort team with less GP placed ahead
            return a.GP - b.GP;
            } else if (b.GP - a.GP !== 0) {
            // if teams pts and GP tied then sort team with more wins placed ahead
            return b.W - a.W;
            } else {
            // If 'Pts' and 'GP' are equal, check 'GP' values for zero
            if (a.GP === 0 && b.GP === 0) {
                // If both 'GP' values are 0, sort by 'teamName' in ascending order
                return a.teamName.localeCompare(b.teamName);
            } else if (a.GP === 0) {
                // If 'GP' of 'a' is 0, it comes first
                return -1;
            } else if (b.GP === 0) {
                // If 'GP' of 'b' is 0, it comes first
                return 1;
            } else {
                // If 'GP' values are non-zero and equal, sort by 'teamName'
                return a.teamName.localeCompare(b.teamName);
            }
        }
    });
  return standings;
}