import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from "path"
import fs from 'fs/promises'
import { q_bot_consts } from "../constants/consts.js"

async function generateRemainingOpponentsImage({teamCodes, sortedGamesPlayed}){
    // get games required vs each opponent
    const gamesVsEachOpponent = q_bot_consts.q_games_vs_opponents

    // teamCodes length used to determine height of canvas
    const teamsRemaining = teamCodes.length;
    const teamsToDisplayPerRow = 8

    const teamLogoHeight = 30
    const teamLogoWidth = 30
    const gamesRemainingRadius = 8

    let canvasWidth;
    let canvasHeight;

    // set canvas dimensions for a single row of opponents left
    if(teamsRemaining <= teamsToDisplayPerRow){
        canvasWidth = teamsRemaining * teamLogoWidth
        canvasHeight = teamLogoHeight
    } else {
        canvasWidth = teamsToDisplayPerRow * teamLogoWidth
    }

    // set canvas height to match that of correct rows needed for remaining opponents
    if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining < teamsToDisplayPerRow * 2) {
        canvasHeight = teamLogoHeight * 2;
    } else if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining < teamsToDisplayPerRow * 3) {
        canvasHeight = teamLogoHeight * 3;
    } else if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining < teamsToDisplayPerRow * 4) {
        canvasHeight = teamLogoHeight * 4;
    } else if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining < teamsToDisplayPerRow * 5) {
        canvasHeight = teamLogoHeight * 5;
    }
    
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "rgb(49,51,56)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    let xPosStart = 0
    let yPosStart = 0

    for(let i = 0; i<teamCodes.length; i++){
        const imagePath = path.join(process.cwd(), "public", "images", "teams", "thumbnails", `${teamCodes[i]}-Thumb.png`)

        const imageBuffer = await fs.readFile(imagePath)
        const logo = await loadImage(imageBuffer)
        // Draw the logos on the canvas
        ctx.drawImage(logo, xPosStart, yPosStart, teamLogoWidth, teamLogoHeight);
        // cut out the circle where games remaining will be displayed
        ctx.beginPath()
        ctx.arc((xPosStart + 30)-gamesRemainingRadius,  yPosStart + gamesRemainingRadius, gamesRemainingRadius, 0, Math.PI*2, false)
        ctx.fill()
        // display games remaining top right corner of image
        let gamesRemainingVsOpponent = 4
        let partialGamesPlayed = false;
        if(teamCodes[i] in sortedGamesPlayed){
            gamesRemainingVsOpponent = gamesVsEachOpponent - sortedGamesPlayed[teamCodes[i]]
            partialGamesPlayed = true
        }

        ctx.beginPath()
        ctx.fillStyle = partialGamesPlayed ? 'rgb(255,102,255)' : 'rgb(153,255,153)'
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "15px Arial"
        ctx.fillText(gamesRemainingVsOpponent.toString(), (xPosStart + 30)-gamesRemainingRadius, yPosStart + gamesRemainingRadius)
        ctx.fillStyle = "rgb(49,51,56)"
        
        if((i + 1) % teamsToDisplayPerRow === 0){
            xPosStart = 0
            yPosStart += teamLogoHeight
        } else {
            xPosStart += teamLogoWidth
        }
    }

    // Return the canvas as a buffer
    return canvas.toBuffer('image/png');
}

export default generateRemainingOpponentsImage;