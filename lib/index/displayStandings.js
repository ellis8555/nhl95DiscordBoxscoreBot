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

    let footerText, sortedStandings, description, byPts = true;
    let teamLogoHeight, teamLogoWidth;

    // Determine settings based on message type
    switch(messageContent){
        case "STANDINGS":
            footerText = "Disclaimer: Tie breaker logic is not official";
            sortedStandings = standings.slice(0, 16);
            teamLogoHeight = 100;
            teamLogoWidth = 100;
            description = `Top 16 by Pts\n\n[View Full Standings](https://wn95-online.vercel.app/league/W/standings)`;
            break;
        case "STANDINGS%":
            footerText = "Disclaimer: Tie breaker logic is not official";
            sortedStandings = standings.slice(0, 16).sort((a, b) => b.Pct - a.Pct);
            byPts = false;
            teamLogoHeight = 100;
            teamLogoWidth = 100;
            description = 'Top 16 by Pct\n\n[View Full Standings](https://wn95-online.vercel.app/league/W/standings)';
            break;
        case "BUBBLE":
            footerText = "Disclaimer: Tie breaker logic is not official";
            sortedStandings = standings.slice(12, 20).sort((a, b) => b.Pct - a.Pct);
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
        canvasWidth = 1800; // wider for 16 teams
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
    const logoX = seedX + 80;
    let statsX, pointsX;
    let gap

    if (messageContent === "STANDINGS" || messageContent === "STANDINGS%") {
        statsX = logoX + teamLogoWidth + 170;
        pointsX = statsX + 450;
        gap = 180
    } else { // BUBBLE
        statsX = logoX + teamLogoWidth + 50;
        pointsX = statsX + 220;
        gap = 40
    }

    // Start Y position
    let yPos = 20;

    for (const standing of sortedStandings) {
        const coach = coaches.find(c => c.team === standing.teamName);
        const teamCode = coach.team;

        // 1️⃣ Draw seed
        ctx.textAlign = "right";
        ctx.fillText(String(standing.seed), seedX + 40, yPos + teamLogoHeight / 4);

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

       
        const statsText = `${wins}  -  ${losses}  -  ${ties}  -  ${otl}`;
        ctx.fillText(statsText, statsX, yPos + teamLogoHeight / 4);

        // Measure width of stats
        const statsWidth = ctx.measureText(statsText).width;


        // 4️⃣ Draw points or pct
        const criteria = byPts ? String(standing.Pts) : String(standing.Pct);
        const criteriaType = byPts ? "Pts" : "Pct";
        ctx.fillText(`${criteria} ${criteriaType}`, statsX + statsWidth + gap, yPos + teamLogoHeight / 4)

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