import extractHomePlayerStats from "../extract-home-player-stats.js"
import extractAwayPlayerStats from "../extract-away-player-stats.js"

function determineGameLength(gameData){
    const homePlayerData = extractHomePlayerStats(gameData, true).slice(0,8)
    const awayPlayerData = extractAwayPlayerStats(gameData, true).slice(0,8)
    const maxMinutes = Math.max(...homePlayerData.map(player => Number(player.TOI.split(":")[0])), ...awayPlayerData.map(player => Number(player.TOI.split(":")[0])) )
    return maxMinutes
}

export default determineGameLength