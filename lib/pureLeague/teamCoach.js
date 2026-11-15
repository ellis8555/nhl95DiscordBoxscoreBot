/*
The following are examples of what each argument passed into teamCoach are
The first 4 are either a 3 letter uppercase string or a digit
The last 2 arguments (5 & 6) are arrays of objects.

1. homeTeam: "ANA"
2. homeTeamScore: 2
3. awayTeam: "BOS"
4. homeTeamScore: 1

ARRAYS

5. teamsEmojiList 
    [
        { "ANA": { "emojiId": "1398008027252002856" } }
    ]
6. coaches
    [
        {
        "id": "582240735793774618",
        "user": "Puss",
        "team": "CAL",
        "sheetsUser": "Puss",
        "emojiName": "",
        "emojiId": "",
        "skipBeingMentioned": false
        }
    ]

*/ 

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
    return `${homeTeamEmoji} ${homeTeamCoach}: ${homeTeamScore} \n${awayTeamEmoji} ${awayTeamCoach}: ${awayTeamScore}`;
}