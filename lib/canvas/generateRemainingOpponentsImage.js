import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from "path"
import fs from 'fs/promises'

async function generateRemainingOpponentsImage({teamCodes}){
    // teamCodes length used to determine height of canvas
    const teamsRemaining = teamCodes.length;
    const rowsNeeded = Math.round(teamsRemaining/5)
    const lastRow = teamsRemaining%5

    const canvasWidth = 400;
    let canvasHeight;
    if(lastRow > 0){
        canvasHeight = 80*rowsNeeded+80
    } else {
        canvasHeight = 80*rowsNeeded
    }

    const teamLogoHeight = 80
    const teamLogoWidth = 80
    
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
            
            if((i + 1) % 5 === 0){
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