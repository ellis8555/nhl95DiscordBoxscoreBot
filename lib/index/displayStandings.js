import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from "path";
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Convert ES module URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wLogo = new AttachmentBuilder("./public/images/league/w.png");

export default async function displayStandings(seasonGamesChannelId, { client, standings, messageContent, coaches }) {
    const channel = client.channels.cache.get(seasonGamesChannelId);
    if (!channel) return;

    if (standings.length === 0) {
        return channel.send("No games have been played yet");
    }

    const footerText = "Tiebreak - H2H, W, GD"
    let sortedStandings, description, byPts = true;
    let teamLogoHeight, teamLogoWidth;

    // Determine settings based on message type
    switch(messageContent){
        case "STANDINGS":
            sortedStandings = standings.slice(0, 16);
            teamLogoHeight = 100;
            teamLogoWidth = 100;
            description = `Top 16 by Pts\n\n[View Full Standings](https://wn95-online.vercel.app/league/W/standings)`;
            break;
        case "STANDINGS%":
            sortedStandings = standings.sort((a, b) => b.Pct - a.Pct).slice(0, 16);
            byPts = false;
            teamLogoHeight = 100;
            teamLogoWidth = 100;
            description = 'Top 16 by Pct\n\n[View Full Standings](https://wn95-online.vercel.app/league/W/standings)';
            break;
        case "BUBBLE":
            sortedStandings = standings.sort((a, b) => b.Pct - a.Pct).slice(12, 20);
            byPts = false;
            teamLogoHeight = 50;
            teamLogoWidth = 50;
            description = 'Bubble teams\n\n[View Full Standings](https://wn95-online.vercel.app/league/W/standings)';
            break;
        default:
            sortedStandings = standings;
            teamLogoHeight = 100;
            teamLogoWidth = 100;
            description = '';
    }

    // Row height
    const rowHeight = teamLogoHeight + 20;

    // Determine canvas width dynamically
    let canvasWidth;
    if (messageContent === "STANDINGS" || messageContent === "STANDINGS%") {
        canvasWidth = 1400; // wider for 16 teams
    } else {
        canvasWidth = 800; // BUBBLE
    }

    const canvasHeight = rowHeight * sortedStandings.length + 50; // dynamic canvas height
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Optional background
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Font setup
    const rowFontSize = Math.floor(teamLogoHeight / 2);
    ctx.font = `bold ${rowFontSize}px sans-serif`;
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";

    // Column positions
    const xMargin = 20;
    const seedX = xMargin;
    let logoX
    let statsX, pointsX;

    if (messageContent === "STANDINGS" || messageContent === "STANDINGS%") {
        logoX = seedX + 100;
        statsX = logoX + teamLogoWidth + 170;
        pointsX = statsX + 450;
    } else { // BUBBLE
        logoX = seedX + 60;
        statsX = logoX + teamLogoWidth + 50;
        pointsX = statsX + 220;
    }

    // Start Y position
    let yPos = 20;
    let standingsPosition = messageContent === "BUBBLE" ? 13 : 1

    for (const standing of sortedStandings) {
        const coach = coaches.find(c => c.team === standing.teamName);
        const teamCode = coach.team;


        // 1️⃣ Draw seed
        ctx.textAlign = "right";
        ctx.fillText(String(standingsPosition), seedX + 40, yPos + teamLogoHeight / 4);
        // increment standings position for next display
        standingsPosition++
        // 2️⃣ Draw team logo
        const imagePath = path.join(__dirname, "..", "..", "public", "images", "teams", "thumbnails", `${teamCode}-Thumb.png`);
        try {
            const imageBuffer = await fs.readFile(imagePath);
            const logo = await loadImage(imageBuffer);
            ctx.drawImage(logo, logoX, yPos, teamLogoWidth, teamLogoHeight);
        } catch (err) {
            console.log("Missing logo:", imagePath);
        }

        // 3️⃣ Draw W-L-T-OTL stats
        ctx.textAlign = "left";
        const wins = String(standing.W);
        const losses = String(standing.L);
        const ties = String(standing.T);
        const otl = String(standing.OTL);
        const seperator = "-"

        // x positions of standings
        // else single character is 28 width   
        const adjWinsXPos = wins.length > 1 ? 356 : 384
        const adjLossesXPos = losses.length > 1 ? 510 : 524
        const adjTiesXPos = ties.length > 1 ? 664 : 678
        const adjOtlXPos = otl.length > 1 ? 818 : 832

        // x bubble positions
        // bubble single character is 14 width
        const bubWinsXPos = wins.length > 1 ? 250 : 257
        const bubLossesXPos = losses.length > 1 ? 334 : 341
        const bubTiesXPos = ties.length > 1 ? 414 : 421
        const bubOtlXPos = otl.length > 1 ? 502 : 509

        // begin setting x positions
        const winsXPos = messageContent === 'BUBBLE' ? bubWinsXPos : adjWinsXPos
        const lossesXPos = messageContent === 'BUBBLE' ? bubLossesXPos : adjLossesXPos
        const tiesXPos = messageContent === 'BUBBLE' ? bubTiesXPos : adjTiesXPos
        const otlXPos = messageContent === 'BUBBLE' ? bubOtlXPos : adjOtlXPos

        // dash seperators
        const firstSeperator = messageContent === 'BUBBLE' ? 299 : 454
        const secondSeperator = messageContent === 'BUBBLE' ? 383 : 608
        const thirdSeperator = messageContent === 'BUBBLE' ? 467 : 762

    
        if(messageContent === 'BUBBLE'){
            // wins
            ctx.fillText(wins, winsXPos, yPos + teamLogoHeight / 4);
            // 1rst seperator
            ctx.fillText(seperator, firstSeperator, yPos + teamLogoHeight / 4);
            // losses
            ctx.fillText(losses, lossesXPos, yPos + teamLogoHeight / 4);
            // 2nd seperator
            ctx.fillText(seperator, secondSeperator, yPos + teamLogoHeight / 4);
            // ties
            ctx.fillText(ties, tiesXPos, yPos + teamLogoHeight / 4);
            // 3rd seperator
            ctx.fillText(seperator, thirdSeperator, yPos + teamLogoHeight / 4);
            // otl
            ctx.fillText(otl, otlXPos, yPos + teamLogoHeight / 4);        
        } else {  
            // wins
            ctx.fillText(wins, winsXPos, yPos + teamLogoHeight / 4);
            // 1rst seperator
            ctx.fillText(seperator, firstSeperator, yPos + teamLogoHeight / 4);
            // losses
            ctx.fillText(losses, lossesXPos, yPos + teamLogoHeight / 4);
            // 2nd seperator
            ctx.fillText(seperator, secondSeperator, yPos + teamLogoHeight / 4);
            // ties
            ctx.fillText(ties, tiesXPos, yPos + teamLogoHeight / 4);
            // 3rd seperator
            ctx.fillText(seperator, thirdSeperator, yPos + teamLogoHeight / 4);
            // otl
            ctx.fillText(otl, otlXPos, yPos + teamLogoHeight / 4);
        }

        // 4️⃣ Draw points or pct
        const criteria = byPts ? String(standing.Pts) : String(standing.Pct);
        const criteriaType = byPts ? "Pts" : "Pct";
        const xPosOfCriteria = messageContent === 'BUBBLE' ? 612 : 1026 
        ctx.fillText(`${criteria} ${criteriaType}`, xPosOfCriteria, yPos + teamLogoHeight / 4)

        // Move down to next row
        yPos += rowHeight;
    }

    // Convert canvas to buffer
    const standingsImage = canvas.toBuffer('image/png');
    const standingsAttachment = new AttachmentBuilder(standingsImage, { name: 'standings.png' });

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle("🏒 WNHL 95 2012 Standings")
        .setColor(0x20aeeb)
        .setDescription(description)
        .setThumbnail('attachment://w.png')
        .setImage('attachment://standings.png')
        .setFooter({ text: footerText });

    await channel.send({ embeds: [embed], files: [wLogo, standingsAttachment] });
}