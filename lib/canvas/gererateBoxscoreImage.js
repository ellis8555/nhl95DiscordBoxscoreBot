import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from "path"

async function generateBoxscoreImage({
    __dirname,
    league,
    homeTeam,
    homeTeamScore,
    homeTeamGoalieStats,
    homeTeamPlayerStats,
    homeTeamGameStats,
    awayTeam,
    awayTeamScore,
    awayTeamGoalieStats,
    awayTeamPlayerStats,
    awayTeamGameStats,
    otherGameStats,
    scoringSummary,
    penaltySummary
}) {
    let $; // used to shorten var assignments.
    let yTextMarker;
    const canvasWidth = 1900; // Canvas width
    const canvasHeight = 830; // Canvas height
    const xCenter = canvasWidth/2 - 140;
    const logoWidth = 300; // Width of each logo
    const logoHeight = 60; // Height of each logo
    const awayTeamLogoX = 10; // logo coords
    const awayTeamLogoY = 30;
    const homeTeamLogoX = 10; 
    const homeTeamLogoY = 430;
    const bannerScoreFont = "DejaVu Sans"; // score fonts
    const bannerScoreSize = 50;
    const bannerScoreColor = "#01ff01";
    const homeTeamBannerScoreX = 400; // banner score coords
    const homeTeamBannerScoreY = 455;
    const awayTeamBannerScoreX = 400;
    const awayTeamBannerScoreY = 60;
    const overTimeIndicatorX = awayTeamBannerScoreX + 100;
    const statHeadingsLine = "#fff"; // color of horizontal lines under stat headers
    const playerNameSpacing = 150;
    const goalieHeaders = ["Goalies", "G", "A", "PTS", "SO", "GA", "SV", "SH", "SV%", "TOI"]; // goalie stat headers
    const goalieHeadersLineX = awayTeamLogoX;
    const playerStatsHeaderLineExtraWidth = 230;
    const awayGoalieHeadersLineY = awayTeamLogoY + logoHeight + 50;
    const homeGoalieHeadersLineY = homeTeamLogoY + logoHeight + 50;
    const playerHeaders = ["Players", "G", "A", "PTS", "SOG", "CHK", "PIM", "PPP", "SHP", "TOI"] // player stat headers
    const playerCount = 8; // how many players to display in player stats
    const playerHeadersLineX = awayTeamLogoX;
    const awayPlayerHeadersLineY = awayGoalieHeadersLineY + 100 // extra to pass the two rows of goalies
    const homePlayerHeadersLineY = homeGoalieHeadersLineY + 100 // extra to pass the two rows of goalies
    const headersFont = "DejaVu Sans"; // headers
    const headersFontSize = 20;
    const headersColor = "#fff";
    const thirdColumnStart = 1000;
  
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // load team logos
    const homeTeamLogo = await loadImage(
      path.join(__dirname, "public", "images", "teams", "banners", `${homeTeam.toUpperCase()}-banner.png`)
    );
    const awayTeamLogo = await loadImage(
      path.join(__dirname, "public", "images", "teams", "banners", `${awayTeam.toUpperCase()}-banner.png`)
    );
    // Draw the logos on the canvas
    ctx.drawImage(awayTeamLogo, awayTeamLogoX, awayTeamLogoY, logoWidth, logoHeight);
    ctx.drawImage(homeTeamLogo, homeTeamLogoX, homeTeamLogoY, logoWidth, logoHeight);
    
    // add scores besides logos
    ctx.font = `${bannerScoreSize}px ${bannerScoreFont}`
    ctx.fillStyle = bannerScoreColor;
    ctx.textBaseline = "middle";
    ctx.fillText(awayTeamScore.toString(), awayTeamBannerScoreX, awayTeamBannerScoreY)
    ctx.fillText(homeTeamScore.toString(), homeTeamBannerScoreX, homeTeamBannerScoreY)

    $ = otherGameStats;
    const wasGameATie = $["wasGameATie"];
    const wasOvertimeRequired = $["overtimeRequired"]
    
    if(wasGameATie || wasOvertimeRequired){
      let overTimeDescriptor;
      if(wasGameATie) { overTimeDescriptor = "T" }
      if(!wasGameATie && wasOvertimeRequired) { overTimeDescriptor = "OT" }

      ctx.font = `${bannerScoreSize}px ${bannerScoreFont}`
      ctx.textBaseline = "middle";
      ctx.fillText(overTimeDescriptor, overTimeIndicatorX, awayTeamBannerScoreY)
    }

    // Add away goalie stat headers lines
    ctx.beginPath();
    ctx.moveTo(goalieHeadersLineX, awayGoalieHeadersLineY);
    const awayBannerScoreWidth = ctx.measureText(awayTeamScore.toString()).width; // Get the width of score text
    ctx.lineTo(awayTeamBannerScoreX + playerStatsHeaderLineExtraWidth, awayGoalieHeadersLineY);
    ctx.strokeStyle = statHeadingsLine;
    ctx.stroke(); // End the first stroke

    // Add away player stat headers lines
    ctx.beginPath();
    ctx.moveTo(playerHeadersLineX, awayPlayerHeadersLineY);
    ctx.lineTo(awayTeamBannerScoreX + playerStatsHeaderLineExtraWidth, awayPlayerHeadersLineY);
    ctx.strokeStyle = statHeadingsLine;
    ctx.stroke(); // End the first stroke

    // Add home goalie stat headers lines
    ctx.beginPath();
    ctx.moveTo(goalieHeadersLineX, homeGoalieHeadersLineY);
    const homeBannerScoreWidth = ctx.measureText(homeTeamScore.toString()).width; // Get the width of score text
    ctx.lineTo(homeTeamBannerScoreX + playerStatsHeaderLineExtraWidth, homeGoalieHeadersLineY); // Use homeGoalieHeadersLineY here
    ctx.strokeStyle = statHeadingsLine;
    ctx.stroke(); // End the second stroke

    // Add home player stat headers lines
    ctx.beginPath();
    ctx.moveTo(playerHeadersLineX, homePlayerHeadersLineY);
    ctx.lineTo(homeTeamBannerScoreX + playerStatsHeaderLineExtraWidth, homePlayerHeadersLineY);
    ctx.strokeStyle = statHeadingsLine;
    ctx.stroke(); // End the first stroke

    // add goalie headers and goalie stats

    ctx.font = `${headersFontSize}px ${headersFont}`
    ctx.fillStyle = headersColor;
    let xTextMarker = goalieHeadersLineX;
    goalieHeaders.forEach((header, index) => {
      const headerWidth = ctx.measureText(header).width;
      let headerSpacing = 8; // allows for extra spacing after players name
      if(index === 0 ) { headerSpacing = playerNameSpacing }
      if(index === 2 || index === 7 || index === 8 ) { headerSpacing = 25 }
      ctx.textAlign = (index === 0 || index === 9 ) ? "start" : "center"
      ctx.textBaseline = "bottom";
      ctx.fillText(header, xTextMarker, awayGoalieHeadersLineY)
      ctx.fillText(header, xTextMarker, homeGoalieHeadersLineY)
      const statHeader = (index===0) ? "Name":header;
      ctx.textBaseline = "top";

      let awayGoalieStarterStat = awayTeamGoalieStats[0][statHeader].toString();
      let awayGoalieBackupStat = awayTeamGoalieStats[1][statHeader].toString();
      let homeGoalieStarterStat = homeTeamGoalieStats[0][statHeader].toString();
      let homeGoalieBackupStat = homeTeamGoalieStats[1][statHeader].toString();
      
      if (index === 8) {
        const goalies = [awayGoalieStarterStat, awayGoalieBackupStat, homeGoalieStarterStat, homeGoalieBackupStat];
        goalies.forEach((goalie, i) => {
          if (goalie === "1") {
            goalies[i] = "1.000";
          } else if (goalie === "0") {
            goalies[i] = ".000";
          } else if (/^0\.[0-9]$/.test(goalie)) {
            goalies[i] = goalie + "00";
            goalies[i] = goalies[i].slice(1);
          } else if (goalie.startsWith("0.")) {
            goalies[i] = goalie.substring(1);
          }
        });
      
        [awayGoalieStarterStat, awayGoalieBackupStat, homeGoalieStarterStat, homeGoalieBackupStat] = goalies;
      }
      
      ctx.fillText(awayGoalieStarterStat, xTextMarker, awayGoalieHeadersLineY + 10) // only two goalies so didn't use a loop
      ctx.fillText(awayGoalieBackupStat, xTextMarker, awayGoalieHeadersLineY + 30)
      ctx.fillText(homeGoalieStarterStat, xTextMarker, homeGoalieHeadersLineY + 10)
      ctx.fillText(homeGoalieBackupStat, xTextMarker, homeGoalieHeadersLineY + 30)
      xTextMarker += headerWidth + headerSpacing;
    })

    // add player headers and player stats

// Define the sorting function for players
const sortPlayerStats = (a, b) => {
  if (b.PTS !== a.PTS) {
    return b.PTS - a.PTS; // Primary sort by PTS
  } else if (b.G !== a.G) {
    return b.G - a.G; // Subsort by G if PTS is tied
  } else if (b.SOG !== a.SOG) {
    return b.SOG - a.SOG; // Subsort by SOG if G is tied
  } else {
    // Convert TOI from "MM:SS" to total seconds for comparison
    const aTOI = parseInt(a.TOI.split(':')[0]) * 60 + parseInt(a.TOI.split(':')[1]);
    const bTOI = parseInt(b.TOI.split(':')[0]) * 60 + parseInt(b.TOI.split(':')[1]);
    return bTOI - aTOI; // Subsort by TOI if SOG is tied
  }
};

// Apply the sorting function to both arrays
homeTeamPlayerStats.sort(sortPlayerStats);
awayTeamPlayerStats.sort(sortPlayerStats);
    
    ctx.font = `${headersFontSize}px ${headersFont}`
    ctx.fillStyle = headersColor;
    xTextMarker = playerHeadersLineX; // this gets adjusted per each heading. the x coord shifts over
    playerHeaders.forEach((header, index) => {
      const headerWidth = ctx.measureText(header).width;
      let headerSpacing = 8; // allows for extra spacing after players name
      if(index === 0 ) { headerSpacing = playerNameSpacing }
      if(index === 2 ) { headerSpacing = 25 }
      ctx.textAlign = (index === 0 || index === 9) ? "start" : "center"
      ctx.textBaseline = "bottom";
      ctx.fillText(header, xTextMarker, awayPlayerHeadersLineY)
      ctx.fillText(header, xTextMarker, homePlayerHeadersLineY)
      const statHeader = (index===0) ? "Name":header;
      ctx.textBaseline = "top";
      let yPlayerMarker = 10
      for(let i = 0; i<playerCount; i++){ // loop through how ever many players are per team
        ctx.fillText(awayTeamPlayerStats[i][statHeader].toString(), xTextMarker, awayPlayerHeadersLineY + yPlayerMarker)
        ctx.fillText(homeTeamPlayerStats[i][statHeader].toString(), xTextMarker, homePlayerHeadersLineY + yPlayerMarker)
        yPlayerMarker += 20
      }
      xTextMarker += headerWidth + headerSpacing;
    })
    // begin middle column
    let leagueLogo;
    if(league === "w"){
      leagueLogo = await loadImage( // add league logo
        path.join(__dirname, "public", "images", "league", `w.png`)
      );
    }
    if(league === "q"){
      leagueLogo = await loadImage( // add league logo
        path.join(__dirname, "public", "images", "league", `q.png`)
      );
    }
    
    const leagueLogoStartY = awayTeamLogoX;
    const leagueLogoHeight = 150;
    const leagueLogoWidth = 150;
    // Draw the logos on the canvas
    ctx.drawImage(leagueLogo, xCenter-leagueLogoWidth/2, leagueLogoStartY, leagueLogoWidth, leagueLogoHeight); // keep in line with away team banner

    // goals per period grid
    const columnCount = 6
    const scoringGridWidth = 300
    const scoringGridHeight = 40
    const scoringGridCellWidth = scoringGridWidth/columnCount
    const scoringGridStartX = xCenter-(scoringGridWidth/2);
    const scoringGridEndX = xCenter+(scoringGridWidth/2)
    const scoringGridStartY = leagueLogoStartY + leagueLogoHeight + 50;

    ctx.strokeStyle = statHeadingsLine;
    ctx.beginPath();  // top horizontal line
    ctx.moveTo(scoringGridStartX, scoringGridStartY);
    ctx.lineTo(scoringGridEndX, scoringGridStartY);
    ctx.stroke();

    ctx.beginPath();  // middle horizontal line
    ctx.moveTo(scoringGridStartX, scoringGridStartY+(scoringGridHeight/2));
    ctx.lineTo(scoringGridEndX, scoringGridStartY+(scoringGridHeight/2));
    ctx.stroke();

    ctx.beginPath();  // bottom horizontal line
    ctx.moveTo(scoringGridStartX, scoringGridStartY+scoringGridHeight);
    ctx.lineTo(scoringGridEndX, scoringGridStartY+scoringGridHeight);
    ctx.stroke();

    ctx.beginPath();  // gird start vertical line
    ctx.moveTo(scoringGridStartX, scoringGridStartY);
    ctx.lineTo(scoringGridStartX, scoringGridStartY+scoringGridHeight);
    ctx.stroke();

    ctx.beginPath();  // vertical 2nd line
    ctx.moveTo(scoringGridStartX+scoringGridCellWidth, scoringGridStartY);
    ctx.lineTo(scoringGridStartX+scoringGridCellWidth, scoringGridStartY+scoringGridHeight);
    ctx.stroke();

    for(let i = 2; i<7; i++){ // loop through lines 3 - 7
      ctx.beginPath(); 
      ctx.moveTo(scoringGridStartX+scoringGridCellWidth*i, scoringGridStartY);
      ctx.lineTo(scoringGridStartX+scoringGridCellWidth*i, scoringGridStartY+scoringGridHeight);
      ctx.stroke();
    }

    // begin populating the period scoring grid
    const scoringGridHeaders = ["1rst", "2nd", "3rd", "OT", "Total"];
    xTextMarker = scoringGridStartX+(scoringGridCellWidth*2)-(scoringGridCellWidth/2)
    scoringGridHeaders.forEach(header => {
      ctx.font = `${headersFontSize}px ${headersFont}`
      ctx.fillStyle = headersColor;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center"
      ctx.fillText(header, xTextMarker, scoringGridStartY)
      xTextMarker += scoringGridCellWidth
    })

    $ = awayTeamGameStats
    const awayTeamPeriodGoals = [awayTeam, $["Away1ST GOALS"].toString(), $["Away2ND GOALS"].toString(), $["Away3RD GOALS"].toString(), $["AwayOT GOALS"].toString(), $["AwayGOALS"].toString() ]
    xTextMarker = scoringGridStartX+(scoringGridCellWidth/2)
    awayTeamPeriodGoals.forEach((stat, index) => {
      ctx.font = `${headersFontSize}px ${headersFont}`
      ctx.fillStyle = ( index === 0 ) ? bannerScoreColor : headersColor
      ctx.textBaseline = "middle";
      ctx.textAlign = "center"
      ctx.fillText(stat, xTextMarker, scoringGridStartY+(scoringGridHeight/4))
      xTextMarker += scoringGridCellWidth
    })

    $ = homeTeamGameStats
    const homeTeamPeriodGoals = [homeTeam, $["Home1ST GOALS"].toString(), $["Home2ND GOALS"].toString(), $["Home3RD GOALS"].toString(), $["HomeOT GOALS"].toString(), $["HomeGOALS"].toString() ]
    xTextMarker = scoringGridStartX+(scoringGridCellWidth/2)
    homeTeamPeriodGoals.forEach((stat, index) => {
      ctx.font = `${headersFontSize}px ${headersFont}`
      ctx.fillStyle = ( index === 0 ) ? bannerScoreColor : headersColor
      ctx.textBaseline = "middle";
      ctx.textAlign = "center"
      ctx.fillText(stat, xTextMarker, scoringGridStartY+(scoringGridHeight - scoringGridHeight/4))
      xTextMarker += scoringGridCellWidth
    })

    // begin game stats data
    const gamesStatsStartY = scoringGridStartY + scoringGridHeight + 40
    const thumbnailsDimensions = 50;
    const awayTeamGamesStatsStartX = xCenter - (scoringGridWidth/3)
    const homeTeamGamesStatsStartX = xCenter + (scoringGridWidth/3)
    const statsBeginY = 40;
    const statsSpacingY = 25;
    const gamesStatsList = ["Shots", "1rst Period", "2nd Period", "3rd Period", "Overtime", "Shooting %", "PowerPlay", "PowerPlay Shots","Shorthanded G", "Breakaways", "One-Timers", "Penalty Shots", "Faceoffs", "Body Checks", "Penalties", "Attack Zone"];
    $ = awayTeamGameStats;
    const awayTeamsGameStatsArray = [
      $["AwaySHOTS"].toString(),
      $["Away1ST SHOTS"].toString(),
      $["Away2ND SHOTS"].toString(),
      $["Away3RD SHOTS"].toString(),
      $["AwayOT SHOTS"].toString(),
      Math.round($["AwayGOALS"] / $["AwaySHOTS"] * 100).toString() + "%",
      `${$["AwayPP GOALS"].toString()}/${homeTeamGameStats["HomePENALTIES"].toString()}`,
      $["AwayPP SHOTS"].toString(),
      $["AwaySHG"].toString(),
      `${$["AwayBREAKAWAY GOALS"].toString()}/${$["AwayBREAKAWAY"].toString()}`,
      `${$["Away1X GOALS"].toString()}/${$["Away1X ATT"].toString()}`,
      `${$["AwayPENALTY SHOT GOALS"].toString()}/${$["AwayPENALTY SHOTS"].toString()}`,
      `${$["AwayFACEOFFS WON"].toString()}/${otherGameStats.faceOffs.toString()}`,
      $["AwayCHECKS"].toString(),
      $["AwayPENALTIES"].toString(),
      $["AwayATTACK"].toString()
    ];
    $ = homeTeamGameStats;
const homeTeamsGameStatsArray = [
  $["HomeSHOTS"].toString(),
  $["Home1ST SHOTS"].toString(),
  $["Home2ND SHOTS"].toString(),
  $["Home3RD SHOTS"].toString(),
  $["HomeOT SHOTS"].toString(),
  Math.round($["HomeGOALS"] / $["HomeSHOTS"] * 100).toString() + "%",
  `${$["HomePP GOALS"].toString()}/${awayTeamGameStats["AwayPENALTIES"].toString()}`,
  $["HomePP SHOTS"].toString(),
  $["HomeSHG"].toString(),
  `${$["HomeBREAKAWAY GOALS"].toString()}/${$["HomeBREAKAWAY"].toString()}`,
  `${$["Home1X GOALS"].toString()}/${$["Home1X ATT"].toString()}`,
  `${$["HomePENALTY SHOT GOALS"].toString()}/${$["HomePENALTY SHOTS"].toString()}`,
  `${$["HomeFACEOFFS WON"].toString()}/${otherGameStats.faceOffs.toString()}`,
  $["HomeCHECKS"].toString(),
  $["HomePENALTIES"].toString(),
  $["HomeATTACK"].toString()
];

// Draw the logos on the canvas
const homeTeamLogoThumbnail = await loadImage(
  path.join(__dirname, "public", "images", "teams", "thumbnails", `${homeTeam.toUpperCase()}-Thumb.png`)
);
const awayTeamLogoThumbnail = await loadImage(
  path.join(__dirname, "public", "images", "teams", "thumbnails", `${awayTeam.toUpperCase()}-Thumb.png`)
);
ctx.drawImage(awayTeamLogoThumbnail, awayTeamGamesStatsStartX - (thumbnailsDimensions/2), gamesStatsStartY - (thumbnailsDimensions/2), thumbnailsDimensions, thumbnailsDimensions);
ctx.drawImage(homeTeamLogoThumbnail, homeTeamGamesStatsStartX - (thumbnailsDimensions/2), gamesStatsStartY - (thumbnailsDimensions/2), thumbnailsDimensions, thumbnailsDimensions);

ctx.fillText("Games Stats", xCenter, gamesStatsStartY)

    ctx.fillStyle = bannerScoreColor;  // fill game stats categories list down the middle
    ctx.textAlign = "center";
    yTextMarker = gamesStatsStartY + statsBeginY;
    gamesStatsList.forEach(item => {
      ctx.fillText(item, xCenter, yTextMarker);
      yTextMarker += statsSpacingY;
    })

    ctx.fillStyle = statHeadingsLine;
    yTextMarker = gamesStatsStartY + statsBeginY; // begin away team stats
    awayTeamsGameStatsArray.forEach(item => {
      ctx.fillText(item, awayTeamGamesStatsStartX, yTextMarker);
      yTextMarker += statsSpacingY;
    })

    yTextMarker = gamesStatsStartY + statsBeginY;
    homeTeamsGameStatsArray.forEach(item => {
      ctx.fillText(item, homeTeamGamesStatsStartX, yTextMarker);
      yTextMarker += statsSpacingY;
    })

    // begin third column
    // scoring summary
    ctx.beginPath(); // scoring summary headers horizontal line
    ctx.moveTo(thirdColumnStart, awayTeamLogoY);
    ctx.lineTo(canvasWidth, awayTeamLogoY);
    ctx.strokeStyle = statHeadingsLine;
    ctx.stroke();

    ctx.textBaseline = "bottom"
    ctx.fillText("Scoring Summary", thirdColumnStart + (canvasWidth - thirdColumnStart)/2, awayTeamLogoY)

    ctx.beginPath(); // scoring summary headers bottom horizontal line
    ctx.moveTo(thirdColumnStart, awayTeamLogoY + 25);
    ctx.lineTo(canvasWidth, awayTeamLogoY + 25);
    ctx.strokeStyle = statHeadingsLine;
    ctx.stroke();

    const scoringSummaryHeaders = ["Per.", "Time", "Team", "Goal", "Primary", "Secondary", "Type"];
    const scoringSummaryData = ["Period", "TIME", "TEAM", "GOALscorer", "ASSIST 1", "ASSIST 2", "TYPE"];
    const xScoringHeaderPlots = [thirdColumnStart]; // Used to correctly place scoring summary data on the x axis
    
    ctx.textBaseline = "bottom";
    ctx.textAlign = "start";
    xTextMarker = thirdColumnStart;
    scoringSummaryHeaders.forEach((header, index) => {
      const headerWidth = ctx.measureText(header).width;
      let headerSpacing = 8; // Allows for extra spacing after player's name
      if (index === 1 || index === 2) { headerSpacing = 12; }
      if (index === 3 || index === 4 || index === 5) { headerSpacing = playerNameSpacing; }
      ctx.fillText(header, xTextMarker, awayTeamLogoY + 25);
      xTextMarker += headerWidth + headerSpacing;
      xScoringHeaderPlots.push(xTextMarker);
    });
    
    ctx.textBaseline = "top";
    yTextMarker = awayTeamLogoY + 35;
    scoringSummary.forEach(summary => {
      scoringSummaryData.forEach((key, index) => {
        const value = (index === 0) ? summary[key].toString() : summary[key]
        ctx.fillText(value, xScoringHeaderPlots[index], yTextMarker);
      });
      yTextMarker += 25;
    });

    // penalty summary
        ctx.beginPath(); // penalty summary headers horizontal line
        ctx.moveTo(thirdColumnStart, homeTeamLogoY);
        ctx.lineTo(canvasWidth, homeTeamLogoY);
        ctx.strokeStyle = statHeadingsLine;
        ctx.stroke();
    
        ctx.textBaseline = "bottom"
        ctx.textAlign = "center"
        ctx.fillText("Penalty Summary", thirdColumnStart + (canvasWidth - thirdColumnStart)/2, homeTeamLogoY)
    
        ctx.beginPath(); // Penalty summary headers bottom horizontal line
        ctx.moveTo(thirdColumnStart, homeTeamLogoY + 25);
        ctx.lineTo(canvasWidth, homeTeamLogoY + 25);
        ctx.strokeStyle = statHeadingsLine;
        ctx.stroke();

        const penaltySummaryHeaders = ["Per.", "Time", "Team", "Player", "Penalty"];
        const penaltySummaryData = ["PERIOD", "TIME", "TEAM", "Penalty", "Type"];
        const xPenaltyHeaderPlots = [thirdColumnStart]
        ctx.textBaseline = "bottom";
        ctx.textAlign = "start";
        xTextMarker = thirdColumnStart;
        penaltySummaryHeaders.forEach((header, index) => {
          const headerWidth = ctx.measureText(header).width;
          let headerSpacing = 8; // Allows for extra spacing after player's name
          if (index === 1 || index === 2) { headerSpacing = 12; }
          if (index === 3 ) { headerSpacing = playerNameSpacing; }
          ctx.fillText(header, xTextMarker, homeTeamLogoY + 25);
          xTextMarker += headerWidth + headerSpacing;
          xPenaltyHeaderPlots.push(xTextMarker);
        });

        ctx.textBaseline = "top";
        yTextMarker = homeTeamLogoY + 35;
        penaltySummary.forEach(summary => {
          penaltySummaryData.forEach((key, index) => {
            const value = (index === 0) ? summary[key].toString() : summary[key]
            ctx.fillText(value, xScoringHeaderPlots[index], yTextMarker);
          });
          yTextMarker += 25;
        });
    
    // Return the canvas as a buffer
    return canvas.toBuffer('image/png');
  };

  export default generateBoxscoreImage;