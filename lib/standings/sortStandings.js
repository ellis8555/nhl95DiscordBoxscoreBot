export default function sortStandings(standings) {
    standings.sort((a,b) => {
        // GP=0 teams go last
        if (a.GP === 0 && b.GP > 0) return 1;
        if (b.GP === 0 && a.GP > 0) return -1;
    
        // Sort by Pts
        if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    
        // Sort by Pct (parse string)
        if (parseFloat(b.Pct) !== parseFloat(a.Pct)) return parseFloat(b.Pct) - parseFloat(a.Pct);
    
        // Fewer games played ahead
        if (a.GP !== b.GP) return a.GP - b.GP;
    
        // Wins
        if (b.W !== a.W) return b.W - a.W;
    
        // Alphabetical fallback
        return a.teamName.localeCompare(b.teamName);
    })

    return standings
}