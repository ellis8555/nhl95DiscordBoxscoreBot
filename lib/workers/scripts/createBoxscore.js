import { parentPort, workerData } from "node:worker_threads"
import generateCanvasImage from "../../canvas/gererateCanvasImage.js"

try {
        const $ = workerData.data;
        // directory being passed in results in extra slash being added so remove one.
        const __dirname = workerData.__dirname.replace(/\\/g, "/")

        const gameDataObj = {
            __dirname,
            homeTeam: $.homeTeamGameStats.HomeTeam,
            homeTeamScore: $.homeTeamGameStats.HomeGOALS,
            homeTeamGoalieStats: $.homeTeamGoalieStats,
            homeTeamPlayerStats: $.homeTeamPlayerStats,
            homeTeamGameStats: $.homeTeamGameStats,
            awayTeam: $.awayTeamGameStats.AwayTeam,
            awayTeamScore: $.awayTeamGameStats.AwayGOALS,
            awayTeamGoalieStats: $.awayTeamGoalieStats,
            awayTeamPlayerStats: $.awayTeamPlayerStats,
            awayTeamGameStats: $.awayTeamGameStats,
            otherGameStats: $.otherGameStats,
            scoringSummary: $.allGoalsScored,
            penaltySummary: $.allPenalties
        }
          const generatedImage = await generateCanvasImage(gameDataObj);

          parentPort.postMessage({status: "success", image: generatedImage})
} catch (error) {
    parentPort.postMessage({status: "error", message: "Error in generating the boxscore image"})
}