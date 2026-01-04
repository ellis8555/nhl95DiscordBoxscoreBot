import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from "path";
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Convert ES module URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateRemainingOpponentsImage({gamesVsEachOpponent, teamCodes, sortedGamesPlayed}){
    const teamsRemaining = teamCodes.length;
    const teamsToDisplayPerRow = 8;

    const teamLogoHeight = 30;
    const teamLogoWidth = 30;
    const gamesRemainingRadius = 8;

    let canvasWidth;
    let canvasHeight;

    // Set canvas dimensions
    if(teamsRemaining <= teamsToDisplayPerRow){
        canvasWidth = teamsRemaining * teamLogoWidth;
        canvasHeight = teamLogoHeight;
    } else {
        canvasWidth = teamsToDisplayPerRow * teamLogoWidth;
    }

    if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining <= teamsToDisplayPerRow * 2) {
        canvasHeight = teamLogoHeight * 2;
    } else if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining <= teamsToDisplayPerRow * 3) {
        canvasHeight = teamLogoHeight * 3;
    } else if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining <= teamsToDisplayPerRow * 4) {
        canvasHeight = teamLogoHeight * 4;
    } else if (teamsRemaining > teamsToDisplayPerRow && teamsRemaining <= teamsToDisplayPerRow * 5) {
        canvasHeight = teamLogoHeight * 5;
    }

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "rgb(49,51,56)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let xPosStart = 0;
    let yPosStart = 0;

    for(let i = 0; i<teamCodes.length; i++){
        const imagePath = path.join(
            __dirname,
            "..", "..",
            "public",
            "images",
            "teams",
            "thumbnails",
            `${teamCodes[i]}-Thumb.png`
        );

        const imageBuffer = await fs.readFile(imagePath);
        const logo = await loadImage(imageBuffer);

        ctx.drawImage(logo, xPosStart, yPosStart, teamLogoWidth, teamLogoHeight);

        // Draw games remaining circle
        ctx.beginPath();
        ctx.fillStyle = "rgb(49,51,56)";
        ctx.arc((xPosStart + 30)-gamesRemainingRadius,  yPosStart + gamesRemainingRadius, gamesRemainingRadius, 0, Math.PI*2, false);
        ctx.fill();

        // Determine games remaining
        let gamesRemainingVsOpponent = gamesVsEachOpponent;
        let partialGamesPlayed = false;
        if(teamCodes[i] in sortedGamesPlayed){
            gamesRemainingVsOpponent = gamesVsEachOpponent - sortedGamesPlayed[teamCodes[i]];
            partialGamesPlayed = true;
        }

        ctx.beginPath();
        ctx.fillStyle = partialGamesPlayed ? 'rgb(255,102,255)' : 'rgb(153,255,153)';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "15px DejaVu Sans";
        ctx.fillText(gamesRemainingVsOpponent.toString(), (xPosStart + 30)-gamesRemainingRadius, yPosStart + gamesRemainingRadius);

        if((i + 1) % teamsToDisplayPerRow === 0){
            xPosStart = 0;
            yPosStart += teamLogoHeight;
        } else {
            xPosStart += teamLogoWidth;
        }
    }

    return canvas.toBuffer('image/png');
}

export default generateRemainingOpponentsImage;
