export default function teamCoach({ homeTeam, homeTeamScore, awayTeam, awayTeamScore, teamsEmojiList, coaches }) {

    // Get home team coach
    const homeTeamCoachObject = coaches.find(coach => coach["team"] === homeTeam);
    const homeTeamCoach = homeTeamCoachObject?.sheetsUser;

    // Get away team coach
    const awayTeamCoachObject = coaches.find(coach => coach["team"] === awayTeam);
    const awayTeamCoach = awayTeamCoachObject?.sheetsUser;

    // Get home team emoji
    const homeTeamObject = teamsEmojiList.find(team => team[homeTeam]);
    const homeTeamEmoji = `<:${homeTeam}:${homeTeamObject?.[homeTeam]?.emojiId}>`;

    // Get away team emoji
    const awayTeamObject = teamsEmojiList.find(team => team[awayTeam]);
    const awayTeamEmoji = `<:${awayTeam}:${awayTeamObject?.[awayTeam]?.emojiId}>`;

    // Create Discord message
    return `${homeTeamEmoji} ${homeTeamCoach}: ${homeTeamScore} \n ${awayTeamEmoji} ${awayTeamCoach} : ${awayTeamScore}`;
}