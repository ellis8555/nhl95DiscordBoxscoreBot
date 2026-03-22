export default function sortStandings(standings){
    standings.sort((a, b) => {
        // First, sort by 'Pts' property in descending order
        if (b.Pts - a.Pts !== 0) {
            return b.Pts - a.Pts;

            // pts tiebreaker goes by Pct
        } else if (b.Pct - a.Pct !== 0) {
            return b.Pct - a.Pct;

        } else if (b.GP - a.GP !== 0) {
            // if teams are tied with points then sort team with less GP placed ahead
            return a.GP - b.GP;

        } else if (b.W - a.W !== 0) {
            // if teams pts and GP tied then sort team with more wins placed ahead
            return b.W - a.W;

        } else {
            if (a.GP === 0 && b.GP === 0) {
                return a.teamName.localeCompare(b.teamName);
            } else if (a.GP === 0) {
                return -1;
            } else if (b.GP === 0) {
                return 1;
            } else {
                return a.teamName.localeCompare(b.teamName);
            }
        }
    });
  return standings;
}