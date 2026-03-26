import { EmbedBuilder, AttachmentBuilder } from "discord.js";

const wLogo = new AttachmentBuilder("./public/images/league/w.png")
export default async function displayStandings(seasonGamesChannelId, { client, standings, messageContent, coaches }) {
    const channel = client.channels.cache.get(seasonGamesChannelId);
    if (!channel) return;

    if (standings.length === 0) {
        return channel.send("No games have been played yet");
    }

    let footerText
    let sortedStandings
    let byPts = true
    switch(messageContent){
        case "STANDINGS":
            footerText = "Top 16 by points"
            sortedStandings = standings.slice(0, 16)
            break;
        case "STANDINGS%":
            footerText = "Top 16 by pct"
            sortedStandings = standings.slice(0, 16).sort((a, b) => b.Pct - a.Pct);
            byPts = false
            break;
        case "BUBBLE":
            footerText = "Bubble teams by pct"
            sortedStandings = standings.slice(12, 20).sort((a, b) => b.Pct - a.Pct);
            byPts = false
            break;
        default:
            footerText = ""
    }
    

    // Build table string
    const tableRows = sortedStandings.map((standing) => {
        const coach = coaches.find(c => c.team === standing.teamName);
        const emoji = coach?.emojiId ? `<:${coach.emojiName}:${coach.emojiId}>` : standing.teamName;

        // Seed, Team, Points with padding
        const seed = String(standing.seed).padStart(2)      // 1, 2, 3…
        const wins = String(standing.W).padStart(4)
        const losses = String(standing.L).padStart(2)
        const ties = String(standing.T).padStart(2)
        const otLosses = String(standing.OTL).padStart(2)
        const points = String(standing.Pts).padStart(3)     //  0, 10, 25
        const percentage = String(standing.Pct).padStart(3)     //  0, 10, 25
        const criteria = byPts ? points : percentage
        const criteriaType = byPts ? "Pts" : "Pct"
        return `\`${seed}\` ${emoji} ${wins} - ${losses} - ${ties} - ${otLosses} - **${criteria} ${criteriaType}**`
    });

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle("🏒 W 2012 Standings")
        .setColor(0x20aeeb) // lightblue
        .setURL("https://wn95-online.vercel.app/league/W/standings")
        .setDescription(tableRows.join("\n"))
        .setThumbnail('attachment://w.png')
        .setFooter({ text: footerText });

    await channel.send({ embeds: [embed], files: [wLogo] });
}

