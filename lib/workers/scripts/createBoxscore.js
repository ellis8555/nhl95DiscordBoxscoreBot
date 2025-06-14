import { parentPort, workerData } from "node:worker_threads"
import generateBoxscoreImage from "../../canvas/gererateBoxscoreImage.js";

try {
        const $ = workerData.data;
        // directory being passed in results in extra slash being added so remove one.
        const __dirname = workerData.__dirname.replace(/\\/g, "/")
        const league = workerData.league

        const gameDataObj = {
            __dirname,
            league,
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
          const generatedImage = await generateBoxscoreImage(gameDataObj);

          parentPort.postMessage({status: "success", image: generatedImage})
} catch (error) {
    parentPort.postMessage({status: "error", errorMessage: "Error in generating the boxscore image"}) // will append fileName in parent catch block
}