import { AttachmentBuilder, Client, Events, GatewayIntentBits } from 'discord.js';
import { teamCodes } from "./lib/game-state-parsing/teamcodes.js";
import readOgRomBinaryGameState from './lib/game-state-parsing/read-og-rom-game-state.js';
import { fileURLToPath } from 'url';
import fs from "node:fs"
import path from "node:path";
import generateCanvasImage from './lib/canvas/gererateCanvasImage.js';
import { bot_consts } from "./lib/constants/consts.js";

const {  
  uniqueIdsFileName, 
  uniqueIdsFileTEST, 
  nhl95Server, 
  testServer, 
  listeningChannel, 
  outputChannel, 
  saveStatePattern, 
  leagueName,
  seasonNum,
} = bot_consts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// TODO: // these are important to update on a regular basis!
const uniqueIdsFile = uniqueIdsFileTEST
const serverName = testServer
const channelName = listeningChannel
const sendResponseToOutputchannel = true // when true response sent to outputChannel otherwise result posted in same channel state is submitted
const outputChannelName = outputChannel
const allowDuplicates =  true // true is for testing
const writeToUniqueIdsFile = false // false for testing. make sure uniqueIdsFileTEST is being used when testing
// TODO:
const saveStateName = saveStatePattern
const league = leagueName
const seasonNumber = seasonNum

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let uniqueIdsFilePath;
let uniqueGameStateIds;
let adminBoxscoreChannelId; // get the channel the bot will be listening in.
let outputChannelId; // the channel that the boxscores will be sent to

client.once(Events.ClientReady, () => { // obtain the channel id for the channel that is being listened to
  console.log(`Logged in as ${client.user.tag}!`);

  if(!allowDuplicates || writeToUniqueIdsFile){ // this is a check for duplicates. not needed when testing
    uniqueIdsFilePath = path.join(__dirname, "public", uniqueIdsFile)   // open and read .csv file for state duplications
    uniqueGameStateIds = fs.readFileSync(uniqueIdsFilePath, 'utf8')
      .split(",")
      .map(id => id.trim())
  }

  const guild = client.guilds.cache.find(guild => guild.name === serverName);
  if(guild){

    const channel = guild.channels.cache.find(channel => channel.name === channelName)
    if(channel){
      adminBoxscoreChannelId = channel.id;
    } else {
      console.log("Channel 'admin-boxscores' not found.")
    }

    const outputChannel = guild.channels.cache.find(channel => channel.name === outputChannelName)
    if(outputChannel){
      outputChannelId = outputChannel.id;
    } else {
      console.log(`Channel '${outputChannelName}' not found.`)
    }
  } else {
    console.log(`${serverName} server not found.`)
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.channel.id !== adminBoxscoreChannelId) return; // channel id obtained in Clientready event
  if (message.author.bot) return;
  if (message.attachments.size < 1) return;

  let gameStateFileNames = []; // holds fileNames for states that are duplicates

  const gameStates = [...message.attachments.values()].filter(state => {
    const isGameState = saveStateName.test(state.name)
    if(!isGameState) return false

    const fileSize = state.size; // veryify file size is within range of a game state
    if(fileSize < 1000000 || fileSize > 1200000) return false
    
    return true
  })
  
    // begin to process the actual files

  for (const gameState of gameStates){
    const fileName = gameState.name;
    try {
      const gameFileURL = gameState.attachment
      const fetchGameFile = await fetch(gameFileURL);
      const gameFileBuffer = await fetchGameFile.arrayBuffer();
  
      // begin reading the game file data
      const romArgs = {
        file:gameFileBuffer,
        seasonNumber,
        gameType : "season",
        leagueName : league,
        teamsDictCodes:teamCodes
      }
      const romData = await readOgRomBinaryGameState(romArgs)

      if(writeToUniqueIdsFile){ // write game id's to .csv files when true
        const gamesUniqueId = romData.data.otherGameStats.uniqueGameId // begin duplication and schedule checks
        const isDuplicate = uniqueGameStateIds.includes(gamesUniqueId)
        const matchup = gamesUniqueId.substring(2, 9);
        const isHomeAwayDuplicated = uniqueGameStateIds.includes(matchup)
        if(isDuplicate || isHomeAwayDuplicated){
          gameStateFileNames.push(fileName)
          continue;
        }
        
        fs.appendFileSync(uniqueIdsFilePath, `${gamesUniqueId},${matchup},`)
        uniqueGameStateIds.push(gamesUniqueId); // Update the in-memory array
        uniqueGameStateIds.push(matchup); // Update the in-memory array
      }

        const gameDataObj = {
          __dirname,
          homeTeam: romData.data.homeTeamGameStats.HomeTeam,
          homeTeamScore: romData.data.homeTeamGameStats.HomeGOALS,
          homeTeamGoalieStats: romData.data.homeTeamGoalieStats,
          homeTeamPlayerStats: romData.data.homeTeamPlayerStats,
          homeTeamGameStats: romData.data.homeTeamGameStats,
          awayTeam: romData.data.awayTeamGameStats.AwayTeam,
          awayTeamScore: romData.data.awayTeamGameStats.AwayGOALS,
          awayTeamGoalieStats: romData.data.awayTeamGoalieStats,
          awayTeamPlayerStats: romData.data.awayTeamPlayerStats,
          awayTeamGameStats: romData.data.awayTeamGameStats,
          otherGameStats: romData.data.otherGameStats,
          scoringSummary: romData.data.allGoalsScored,
          penaltySummary: romData.data.allPenalties
        };
  
        const imageBuffer = await generateCanvasImage(gameDataObj);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'boxscore.png' })

        if(sendResponseToOutputchannel){ // send to a different channel from where the game state was uploaded
          await client.channels.cache.get(outputChannelId).send({files: [attachment] });  // this outputs to boxscore channel
        } else { // send to same channel in which the state was submitted.
          await message.channel.send({files: [attachment] }); // this is channel where states are posted
        }
      }catch(error){
        await message.channel.send(`Failed to process file ${gameState.name}. Please check the file and try again.`)
      }
  }
  
  if(gameStateFileNames.length > 0){
    const fileCount = gameStateFileNames.length;
    let duplicateStringMessage = "";
    gameStateFileNames.forEach(file => {
      duplicateStringMessage += ` ${file}\n`;
    })
    await message.channel.send(
      `The following ${fileCount} game state(s) were NOT processed as they appear to be duplicates OR the home/away did not switch.\n${duplicateStringMessage}`
    )
  }

});

client.login(process.env.token);