import fs from "node:fs"
import path from "node:path";
import { fileURLToPath } from 'url';
import { google } from "googleapis";
import { AttachmentBuilder, Client, Events, GatewayIntentBits } from 'discord.js';
// lib files
import readOgRomBinaryGameState from './lib/game-state-parsing/read-og-rom-game-state.js';
import appendGoogleSheetsData from "./lib/google-sheets/appendGoogleSheetsData.js"
import createWorker from "./lib/workers/createWorker.js";
import cleanUpBotMessages from "./lib/index/cleanUpBotMessages.js";
import { bot_consts, q_bot_consts, pure_consts, bot_consts_update_emitter, q_bot_consts_update_emitter, p_bot_consts_update_emitter } from "./lib/constants/consts.js";
// pure files
import processPure from "./lib/pureLeague/processPure.js";
import setPureSettings from "./lib/pureLeague/setPureSettings.js"
import parseAdminMessage from "./lib/index/parseAdminMessage.js";
import mentionRemainingOpponents from "./lib/index/mentionRemainingOpponents.js";
import displayRemainingOpponents from "./lib/index/displayRemainingOpponents.js";
import showRemainingGames from "./lib/index/showRemainingGames.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

////////////////
// W league vars
////////////////

const {  
  token,
  uniqueIdsFileName,  
  server,
  leagueName,
  sendResponseToOutputchannel,
  coaches,
} = bot_consts

const uniqueIdsFile = uniqueIdsFileName
let adminsListeningChannelName = bot_consts.adminsListeningChannel
let saveStatesListeningChannelName = bot_consts.saveStatesListeningChannel
let boxscoreOutputChannelName = bot_consts.boxscoreOutputChannel
let seasonGamesChannel = bot_consts.seasonGamesChannel
let saveStateName = new RegExp(bot_consts.saveStatePattern)
let seasonNumber = bot_consts.seasonNum
let teamCodes = bot_consts.teamCodes
let adminIdObject = bot_consts.editPermission
let adminCommands = bot_consts.adminCommands
let pauseWLeague = bot_consts.pauseWLeague
let w_games_vs_opponents = bot_consts.w_games_vs_opponents
let excludeCoaches = bot_consts.excludeCoaches
let remainingGames = bot_consts.remainingGames
let isPlayoffs = bot_consts.isPlayoffs

// update variables that come from admin within discord channel
bot_consts_update_emitter.on("bot_consts_update_emitter", (updatedConsts) => {
  saveStatesListeningChannelName = updatedConsts.saveStatesListeningChannel
  boxscoreOutputChannelName = updatedConsts.boxscoreOutputChannel
  adminsListeningChannelName = updatedConsts.adminsListeningChannel
  seasonGamesChannel = updatedConsts.seasonGamesChannel
  saveStateName = new RegExp(updatedConsts.saveStatePattern)
  seasonNumber = updatedConsts.seasonNum
  teamCodes = updatedConsts.teamCodes
  adminIdObject = updatedConsts.editPermission
  adminCommands = updatedConsts.adminCommands
  pauseWLeague = updatedConsts.pauseWLeague
  w_games_vs_opponents = updatedConsts.w_games_vs_opponents
  excludeCoaches = updatedConsts.excludeCoaches
  remainingGames = updatedConsts.remainingGames
  isPlayoffs = updatedConsts.isPlayoffs
  isPlayoffs = updatedConsts.isPlayoffs
  // updates channel in which the boxscores will be posted
  const guild = client.guilds.cache.find(guild => guild.name === server);
  if(guild){
    boxscoreOutputChannelId = guild.channels.cache.find(channel => channel.name === boxscoreOutputChannelName).id;
    // admins commands channel id
    adminsListeningChannelId = guild.channels.cache.find(channel => channel.name === adminsListeningChannelName).id
    // save states listening channels id
    saveStatesChannelId = guild.channels.cache.find(channel => channel.name === saveStatesListeningChannelName).id;
      // season games listening channels id
    seasonGamesChannelId = guild.channels.cache.find(channel => channel.name === seasonGamesChannel).id;
  }
})

////////////////
// Q league vars
////////////////

const {  
  q_uniqueIdsFileName,
  q_leagueName,
  q_sendResponseToOutputchannel,
} = q_bot_consts

const q_uniqueIdsFile = q_uniqueIdsFileName
const q_league = q_leagueName
let q_adminsListeningChannelName = q_bot_consts.adminsListeningChannel
let q_saveStatesListeningChannelName = q_bot_consts.saveStatesListeningChannel
let q_boxscoreOutputChannelName = q_bot_consts.boxscoreOutputChannel
let q_seasonGamesChannel = q_bot_consts.seasonGamesChannel
let q_saveStateName = new RegExp(q_bot_consts.saveStatePattern)
let q_seasonNumber = q_bot_consts.q_seasonNum
let q_teamCodes = q_bot_consts.teamCodes
let q_adminIdObject = q_bot_consts.editPermission
let q_adminCommands = q_bot_consts.adminCommands
let q_pauseQLeague = q_bot_consts.pauseQLeague
let q_excludeCoaches = q_bot_consts.excludeCoaches
let q_isPlayoffs = q_bot_consts.q_isPlayoffs

// update variables that come from admin within discord channel
q_bot_consts_update_emitter.on("q_bot_consts_update_emitter", (updatedConsts) => {
  q_saveStatesListeningChannelName = updatedConsts.saveStatesListeningChannel
  q_boxscoreOutputChannelName = updatedConsts.boxscoreOutputChannel
  q_adminsListeningChannelName = updatedConsts.adminsListeningChannel
  q_seasonGamesChannel = updatedConsts.seasonGamesChannel
  q_saveStateName = new RegExp(updatedConsts.saveStatePattern)
  q_seasonNumber = updatedConsts.q_seasonNum
  q_teamCodes = updatedConsts.teamCodes
  q_adminIdObject = updatedConsts.editPermission
  q_adminCommands = updatedConsts.adminCommands
  q_pauseQLeague = updatedConsts.pauseQLeague
  q_excludeCoaches = updatedConsts.excludeCoaches
  q_isPlayoffs = updatedConsts.q_isPlayoffs
  q_isPlayoffs = updatedConsts.q_isPlayoffs
  // updates channel in which the boxscores will be posted
  const q_guild = client.guilds.cache.find(guild => guild.name === q_server);
  if(q_guild){
    q_boxscoreOutputChannelId = q_guild.channels.cache.find(channel => channel.name === q_boxscoreOutputChannelName).id;
    // admins commands channel id
    q_adminsListeningChannelId = q_guild.channels.cache.find(channel => channel.name === q_adminsListeningChannelName).id
    // save states listening channels id
    q_saveStatesChannelId = q_guild.channels.cache.find(channel => channel.name === q_saveStatesListeningChannelName).id;
    // season games listening channels id
    q_seasonGamesChannelId = q_guild.channels.cache.find(channel => channel.name === q_seasonGamesChannel).id;
  }
})

///////////////////
// Pure league vars
///////////////////

const {  
  p_uniqueIdsFileName,
} = pure_consts

const p_uniqueIdsFile = p_uniqueIdsFileName
let p_seasonGamesChannel = pure_consts.seasonGamesChannel
let p_submitScoresChannel = pure_consts.listeningChannel
let p_seasonNumber = pure_consts.currentSeason
let p_teamCodes = pure_consts.teamCodesList
let p_adminIdObject = pure_consts.editPermission
let p_excludeCoaches = pure_consts.excludeCoaches

// update variables that come from admin within discord channel
p_bot_consts_update_emitter.on("p_bot_consts_update_emitter", (updatedConsts) => {
  p_seasonGamesChannel = updatedConsts.seasonGamesChannel
  p_seasonNumber = updatedConsts.currentSeason
  p_teamCodes = updatedConsts.teamCodesList
  p_adminIdObject = updatedConsts.editPermission
  p_submitScoresChannel = updatedConsts.listeningChannel
  p_excludeCoaches = updatedConsts.excludeCoaches
  // updates channel in which the boxscores will be posted
  const p_guild = client.guilds.cache.find(guild => guild.name === pureServer);
  if(p_guild){
    // season games listening channels id
    p_seasonGamesChannelId = p_guild.channels.cache.find(channel => channel.name === p_seasonGamesChannel).id;
    // submit scores listening channel id
    p_submitScoresChannelId = p_guild.channels.cache.find(channel => channel.name === p_submitScoresChannel).id;
  }
})

// w server
const w_server = process.env.server

// q server
const q_server = process.env.qServer

// pureServer
const pureServer = process.env.pureServer;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let sheets;
let spreadsheetId
let w_spreadsheetId
let q_spreadsheetId
let uniqueIdsFilePath
let uniqueGameStateIds
let adminsListeningChannelId // channel that listens for admin commands
let saveStatesChannelId // get the channel the bot will be listening in.
let boxscoreOutputChannelId // the channel that the boxscores will be sent to
let seasonGamesChannelId
let boxscoreImageGameId // puss request for ticklebots

let q_boxscoreOutputChannelId
let q_adminsListeningChannelId
let q_saveStatesChannelId
let q_seasonGamesChannelId

let p_seasonGamesChannelId
let p_submitScoresChannelId

const gameStateQueue = []; // holds incoming game states to be processed
let processing = false; // checks if game state is currently being processed from the queue;
let isProcessingErrors = false; // checks if bot is performing error message tasks

let cleanUpMessagesId;
const userProcessingMessages = []; // holds id of processing/complete messages in order to be cleaned up
const duplicateGameStateFileNames = []; // holds fileNames for states that are duplicates
const readingGameStateError = [] // holds errors related to reading in the game file
const googleSheetApiErrors = [];  // holds references to any errors during game appends

let q_cleanUpMessagesId;
const q_userProcessingMessages = []; // holds id of processing/complete messages in order to be cleaned up
const q_duplicateGameStateFileNames = []; // holds fileNames for states that are duplicates
const q_readingGameStateError = [] // holds errors related to reading in the game file
const q_googleSheetApiErrors = [];  // holds references to any errors during game appends

client.once(Events.ClientReady, () => { // obtain the channel id for the channel that is being listened to
  console.log(`Logged in as ${client.user.tag}!`);

  // get W server
  const guild = client.guilds.cache.find(guild => guild.name === server);
  if(guild){
    w_spreadsheetId = process.env.spreadsheetId
      // channel listening for admin commands
      const adminCommandsListeningChannel = guild.channels.cache.find(channel => channel.name === adminsListeningChannelName)
      if(adminCommandsListeningChannel){
        adminsListeningChannelId = adminCommandsListeningChannel.id;
      } else {
        console.log(`Channel adminsListeningChannelName not found.`)
      }
    // channel listening for save states
    const saveStatesChannel = guild.channels.cache.find(channel => channel.name === saveStatesListeningChannelName)
    if(saveStatesChannel){
      saveStatesChannelId = saveStatesChannel.id;
    } else {
      console.log(`Channel saveStatesListeningChannel not found.`)
    }

    // channel for outputting the boxscores
    const boxscoreOutputChannel = guild.channels.cache.find(channel => channel.name === boxscoreOutputChannelName)
    if(boxscoreOutputChannel){
      boxscoreOutputChannelId = boxscoreOutputChannel.id;
    } else {
      console.log(`Channel boxscoreOutputChannelName' not found.`)
    }

    // channel for outputting remaining opponents
    const w_remaining_opponents_output_channel = guild.channels.cache.find(channel => channel.name === seasonGamesChannel)
    if(w_remaining_opponents_output_channel){
      seasonGamesChannelId = w_remaining_opponents_output_channel.id;
    } else {
      console.log(`Channel seasonGamesChannelId' not found.`)
    }
  } else {
    console.log(`${server} can't be found.`)
  }

  // get Q server
  const q_guild = client.guilds.cache.find(guild => guild.name === q_server);
  if(q_guild){
    q_spreadsheetId = process.env.qSpreadSheetId
      // channel listening for admin commands
      const q_adminCommandsListeningChannel = q_guild.channels.cache.find(channel => channel.name === q_adminsListeningChannelName)
      if(q_adminCommandsListeningChannel){
        q_adminsListeningChannelId = q_adminCommandsListeningChannel.id;
      } else {
        console.log(`Channel q_adminsListeningChannelName not found.`)
      }

      // channel listening for save states
      const q_saveStatesChannel = q_guild.channels.cache.find(channel => channel.name === q_saveStatesListeningChannelName)
      if(q_saveStatesChannel){
        q_saveStatesChannelId = q_saveStatesChannel.id;
      } else {
        console.log(`Channel q_saveStatesListeningChannel not found.`)
      }

      // channel for outputting the boxscores
      const q_boxscoreOutputChannel = q_guild.channels.cache.find(channel => channel.name === q_boxscoreOutputChannelName)
      if(q_boxscoreOutputChannel){
        q_boxscoreOutputChannelId = q_boxscoreOutputChannel.id;
      } else {
        console.log(`Channel q_boxscoreOutputChannelName' not found.`)
      }

      // channel for outputting remaining opponents
      const q_remaining_opponents_output_channel = q_guild.channels.cache.find(channel => channel.name === q_seasonGamesChannel)
      if(q_remaining_opponents_output_channel){
        q_seasonGamesChannelId = q_remaining_opponents_output_channel.id;
      } else {
        console.log(`Channel q_seasonGamesChannelId' not found.`)
      }
    } else {
      console.log(`${q_server} can't be found.`)
    }

  // get P server
  const p_guild = client.guilds.cache.find(guild => guild.name === pureServer);
  if(p_guild){
      // channel listening for save states
      const p_submitScoresListeningChannel = p_guild.channels.cache.find(channel => channel.name === p_submitScoresChannel)
      if(p_submitScoresListeningChannel){
        p_submitScoresChannelId = p_submitScoresListeningChannel.id;
      } else {
        console.log(`Channel q_saveStatesListeningChannel not found.`)
      }

      // channel for outputting remaining opponents
      const p_remaining_opponents_output_channel = p_guild.channels.cache.find(channel => channel.name === p_seasonGamesChannel)
      if(p_remaining_opponents_output_channel){
        p_seasonGamesChannelId = p_remaining_opponents_output_channel.id;
      } else {
        console.log(`Channel q_seasonGamesChannelId' not found.`)
      }
    } else {
      console.log(`${pureServer} can't be found.`)
    }

  if(guild || q_guild){
        // begin connections to google sheets
        const serviceAccount = JSON.parse(fs.readFileSync("./serviceKeys.json"));

        // Initialize the Sheets API client in the main thread
        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        sheets = google.sheets({ version: "v4", auth });
  }

});

async function processQueue (){
  if(gameStateQueue.length === 0 || processing || isProcessingErrors) {
    return; // If queue is empty or processing a file;
  }
  processing = true; // processing is occuring
  const task = gameStateQueue.shift(); // Get the first file in the queue

  // @ mention remaining opponents W, Q and Pure leagues
  if(task.isMentionOpponentRequest){
    const { server, client, coachId, userMessage } = task;
    if(server === w_server){
      const { seasonGamesChannelId, messageId } = task
      // get w constants
      const wFilePath = path.join(process.cwd(), "public", "json", "bot_constants.json")
      const readWFile = fs.readFileSync(wFilePath, "utf-8")
      const w_bot_consts = JSON.parse(readWFile);

      // get gamesplayed data from unique id's file
      const wUniqueIdsFilePath = path.join(process.cwd(), "public", "wUniqueIds.csv")
      const uniqueIdsFile = fs.readFileSync(wUniqueIdsFilePath, "utf-8");
      
      const { teamCodes, coaches } = w_bot_consts;
      await mentionRemainingOpponents(seasonGamesChannelId, excludeCoaches, {server, client, coachId, teamCodes, messageId, userMessage, coaches, excludeCoaches, uniqueIdsFile})
    }

    if(server === q_server){
      const { q_seasonGamesChannelId } = task
      // get q constants
      const qFilePath = path.join(process.cwd(), "public", "json", "q_bot_constants.json")
      const readQFile = fs.readFileSync(qFilePath, "utf-8")
      const q_bot_consts = JSON.parse(readQFile);

      // get gamesplayed data from unique id's file
      const qUniqueIdsFilePath = path.join(process.cwd(), "public", "qUniqueIds.csv")
      const uniqueIdsFile = fs.readFileSync(qUniqueIdsFilePath, "utf-8");
      
      const { teamCodes, coaches } = q_bot_consts;

      await mentionRemainingOpponents(q_seasonGamesChannelId, q_excludeCoaches, {server, client, coachId, teamCodes, userMessage, coaches, uniqueIdsFile})
    }

    if(server === pureServer){
      const { p_seasonGamesChannelId } = task
      // get q constants
      const pFilePath = path.join(process.cwd(), "public", "json", "pure_bot_constants.json")
      const readPFile = fs.readFileSync(pFilePath, "utf-8")
      const p_bot_consts = JSON.parse(readPFile)
      
      // get gamesplayed data from unique id's file
      const p_uniqueIdsFilePath = path.join(process.cwd(), "public", "pUniqueIds.csv")
      const uniqueIdsFile = fs.readFileSync(p_uniqueIdsFilePath, "utf-8")

      const { teamCodesList: teamCodes, coaches } = p_bot_consts
      await mentionRemainingOpponents(p_seasonGamesChannelId, p_excludeCoaches, {server, client, coachId, teamCodes, userMessage, coaches, uniqueIdsFile})
    }

    processing = false;
    return;
  }

  // each player can set opting out of being mentioned during season games call
  if(task.isOptOutOfBeingMentioned){
    const { server, client, coachId, messageContent, seasonGamesChannelId} = task;

    if(server === w_server){
      // set w league players mention status
      const wFilePath = path.join(process.cwd(), "public", "json", "bot_constants.json")
      const readWFile = fs.readFileSync(wFilePath, "utf-8")
      const w_bot_consts = JSON.parse(readWFile);
      const { coaches: w_coaches } = w_bot_consts;

      const w_coachToEdit = w_coaches.find(coach => coach.id === coachId)
      if(w_coachToEdit){
        if(/^fuck off$/i.test(messageContent)){
          w_coachToEdit.skipBeingMentioned = true
        }
        if(/^fuck on$/i.test(messageContent)){
          w_coachToEdit.skipBeingMentioned = false
        }
      }
      // set q league players mention status
      const qFilePath = path.join(process.cwd(), "public", "json", "q_bot_constants.json")
      const readQFile = fs.readFileSync(qFilePath, "utf-8")
      const q_bot_consts = JSON.parse(readQFile);
      const { coaches: q_coaches } = q_bot_consts;

      const q_coachToEdit = q_coaches.find(coach => coach.id === coachId)
      if(q_coachToEdit){
        if(/^fuck off$/i.test(messageContent)){
          q_coachToEdit.skipBeingMentioned = true
        }
        if(/^fuck on$/i.test(messageContent)){
          q_coachToEdit.skipBeingMentioned = false
        }
      }
      // set pure league players mention status
      const pFilePath = path.join(process.cwd(), "public", "json", "pure_bot_constants.json")
      const readPFile = fs.readFileSync(pFilePath, "utf-8")
      const p_bot_consts = JSON.parse(readPFile);
      const { coaches: p_coaches } = p_bot_consts;

      const p_coachToEdit = p_coaches.find(coach => coach.id === coachId)
      if(p_coachToEdit){
        if(/^fuck off$/i.test(messageContent)){
          p_coachToEdit.skipBeingMentioned = true
        }
        if(/^fuck on$/i.test(messageContent)){
          p_coachToEdit.skipBeingMentioned = false
        }
      }

      // update the settings in each leagues json file
      // w league
      const updated_w_consts = JSON.stringify(w_bot_consts, null, 2)
      fs.writeFileSync(wFilePath, updated_w_consts)
      // q league
      const updated_q_consts = JSON.stringify(q_bot_consts, null, 2)
      fs.writeFileSync(qFilePath, updated_q_consts)
      // pure league
      const updated_p_consts = JSON.stringify(p_bot_consts, null, 2)
      fs.writeFileSync(pFilePath, updated_p_consts)

      // alert user of there being mentioned status

      const channel = await client.channels.fetch(seasonGamesChannelId)
      const coachName = w_coachToEdit.user
      const userMessageSent = w_coachToEdit.skipBeingMentioned === true ? `${coachName} being alerted off` : `${coachName} will be alerted`
      await channel.send(userMessageSent)

    }
    processing = false
    return
  }

  // display remaining opponents W and Q
  if(task.isOpponentRequest){
    const { server, client, teamAbbreviation } = task;
    if(server === w_server){
      const { seasonGamesChannelId } = task
      // get q constants
      const wFilePath = path.join(process.cwd(), "public", "json", "bot_constants.json")
      const readWFile = fs.readFileSync(wFilePath, "utf-8")
      const bot_consts = JSON.parse(readWFile);

      // get gamesplayed data from unique id's file
      const wUniqueIdsFilePath = path.join(process.cwd(), "public", "wUniqueIds.csv")
      const uniqueIdsFile = fs.readFileSync(wUniqueIdsFilePath, "utf-8");
      
      const { teamCodes, coaches } = bot_consts;

      await displayRemainingOpponents(seasonGamesChannelId, excludeCoaches, {server, client, teamAbbreviation, teamCodes, coaches, uniqueIdsFile})
    }
    if(server === q_server){
      const { q_seasonGamesChannelId } = task
      // get q constants
      const qFilePath = path.join(process.cwd(), "public", "json", "q_bot_constants.json")
      const readQFile = fs.readFileSync(qFilePath, "utf-8")
      const q_bot_consts = JSON.parse(readQFile);

      // get gamesplayed data from unique id's file
      const qUniqueIdsFilePath = path.join(process.cwd(), "public", "qUniqueIds.csv")
      const uniqueIdsFile = fs.readFileSync(qUniqueIdsFilePath, "utf-8");
      
      const { teamCodes, coaches } = q_bot_consts;

      await displayRemainingOpponents(q_seasonGamesChannelId, q_excludeCoaches, {server, client, teamAbbreviation, teamCodes, coaches, uniqueIdsFile})
    }
    processing = false;
    return;
  }

  // process admin tasks W and Q
  if(task.isAdminInstruction){
    const { server, adminMessage, client, csvFile, sheets } = task;
    if(server === w_server){
      const { adminsListeningChannelId } = task
      await parseAdminMessage(adminsListeningChannelId, {server, adminMessage, client, csvFile, sheets})
    }
    if(server === q_server){
      const { q_adminsListeningChannelId } = task
      await parseAdminMessage(q_adminsListeningChannelId, {server, adminMessage,  client, csvFile, sheets})
    }
    processing = false;
    return;
  }

  // show remaining games when 20 games or less remain
  if(task.isShowEndOfScheduleRequest){
    const { server, client, coachId, messageContent } = task;
    if(server === w_server){
      const { seasonGamesChannelId } = task
      const leagueName = "W"
      await showRemainingGames(seasonGamesChannelId, {client, coachId, leagueName, messageContent})
    }
    processing = false;
    return;
  }

  // process incoming tasks from pure league
  if(task.server === pureServer){
    const { processPureArgs } = task
    // test for admin message changing league settings such as coaches or season number
    const userMessage = processPureArgs.message.content
    const message = processPureArgs.message
    if(userMessage === 'UPDATE SETTINGS'){
      if(message.author.id === p_adminIdObject['ticklepuss']){
        setPureSettings(processPureArgs)
      }
      processing = false;
    } else {
      // process a score entry
      await processPure(processPureArgs)
      processing = false;
    }
  }

  // process game state from W league
  if(task.server === w_server){
    if(!bot_consts.allowDuplicates || bot_consts.writeToUniqueIdsFile){ // this is a check for duplicates. not needed when testing
      uniqueIdsFilePath = path.join(__dirname, "public", uniqueIdsFile)   // open and read .csv file for state duplications
      uniqueGameStateIds = fs.readFileSync(uniqueIdsFilePath, 'utf8')
        .split(",")
        .map(id => id.trim())
    }
  
    const { message, name, spreadsheetId } = task
    const sentProcessingMessage = await message.channel.send(`Processing: ${name}`)
    userProcessingMessages.push(sentProcessingMessage.id)

    let romData;
    try {
      const fileName = task.name;
      const gameFileURL = task.attachment;
      const fetchGameFile = await fetch(gameFileURL);
      const gameFileBuffer = await fetchGameFile.arrayBuffer();

      const romArgs = {
        file: gameFileBuffer,
        seasonNumber,
        gameType: "season",
        leagueName,
        teamsDictCodes: teamCodes,
      };
      romData = await readOgRomBinaryGameState(romArgs);

      // Perform checks and processing as before
      const { 'GAME LENGTH': gameLength } = romData.data.otherGameStats;
      const gameLengthInt = parseInt(gameLength.replace(":", ""), 10);
      if(gameLengthInt < 1500){
        readingGameStateError.push(fileName)
        throw new Error(`Error: \`${fileName}\` is short of 15:00.`);
      }
  
        // check that both teams are not the same. 
        if(romData.data.otherGameStats.homeTeam === romData.data.otherGameStats.awayTeam){
          readingGameStateError.push(fileName)
          throw new Error(`Error: \`${fileName}\` home and away teams are the same.`)
        }
  
        let gamesUniqueId;
        let matchup;
        if(bot_consts.writeToUniqueIdsFile){ // if not writing to uniqueId's file then don't need to proceed here
          gamesUniqueId = romData.data.otherGameStats.uniqueGameId // begin duplication and schedule checks
          const isDuplicate = uniqueGameStateIds.includes(gamesUniqueId)
          matchup = gamesUniqueId.substring(2, 9);
          const isHomeAwayDuplicated = uniqueGameStateIds.includes(matchup)
          if(isDuplicate){
            duplicateGameStateFileNames.push(fileName)
            throw new Error(`Error: \`${fileName}\` appears to be a duplicate.`)
          }
          if(isHomeAwayDuplicated){
            duplicateGameStateFileNames.push(fileName)
            throw new Error(`Error: \`${fileName}\` home/away sequence has previously been submitted.`)
          }
        }
  
      // Handle file processing (e.g., generating boxscore, appending data to Google Sheets)
      const data = romData.data;
      const league = leagueName
      const generateBoxscore = createWorker('./lib/workers/scripts/createBoxscore.js', { data, __dirname, league });
  
      if(bot_consts.writeToGoogleSheets){
        // send game data to google sheets
        const sheetsArgsObj = {
          sheets,
          spreadsheetId,
          romData
        }
        try { // append to google sheets try block
          const googleSheetsResponse = await appendGoogleSheetsData(sheetsArgsObj)
          // if error returned throw error
          if(googleSheetsResponse && googleSheetsResponse.status === 'error'){
            throw new Error(googleSheetsResponse.message)
          }
          boxscoreImageGameId = googleSheetsResponse
        } catch (error) {
          googleSheetApiErrors.push(fileName)
          throw new Error(`\`${fileName}\` ${error.message}`)
        }
      }
  
      // after successful google sheets append
      if(bot_consts.writeToUniqueIdsFile){
        try {
          uniqueGameStateIds.push(gamesUniqueId); // Update the in-file array
          uniqueGameStateIds.push(matchup); // Update the in-file array
          fs.appendFileSync(uniqueIdsFilePath, `${gamesUniqueId},${matchup},`) 
          // update array that contains remaining matchups when season coming to an end
          // only do this if the array contains season ending matchups count < 20 or so
          const filePath = path.join(process.cwd(), "public", "json", "bot_constants.json")
          const file = fs.readFileSync(filePath, "utf-8")
          const wConstsData = JSON.parse(file)
          const { remainingGames } = wConstsData
          if(remainingGames.length > 0){
            const homeTeam = romData.data.otherGameStats.homeTeam
            const awayTeam = romData.data.otherGameStats.awayTeam
            const matchup = `${homeTeam}/${awayTeam}`
            const getMatchupFromRemainingGames = remainingGames.indexOf(matchup)
            if(getMatchupFromRemainingGames !== -1){
              remainingGames.splice(getMatchupFromRemainingGames, 1)
              fs.writeFileSync(filePath, JSON.stringify(wConstsData, null, 2), "utf-8")
            }
          }
        } catch (error) {
          throw new Error("Error occured in trying to write to uniqueId text file.")
        }
      }
  
      if(bot_consts.sendBoxscore) {
        const { status, image, errorMessage } = await generateBoxscore;
        if(status === "success") {
          const imageBuffer = Buffer.from(image);
          const gamesUniqueId = romData.data.otherGameStats.uniqueGameId
          const seasonNumber = gamesUniqueId.slice(0,2)
          const imageFileName = `${seasonNumber}-${boxscoreImageGameId ?? 'test'}`
          const attachment = new AttachmentBuilder(imageBuffer, { name: `${imageFileName}.png` });
            if(sendResponseToOutputchannel) {
              await client.channels.cache.get(boxscoreOutputChannelId).send({ files: [attachment] });
            } else {
              await task.message.channel.send({ files: [attachment] });
            }
          }
          if(status === "error") {
            throw new Error(errorMessage);
          }
        }
  
      const sentCompleteMessage = await message.channel.send(`Complete: \`${name}\``)
      userProcessingMessages.push(sentCompleteMessage.id)
  
    } catch (error) {
      await message.channel.send(`❌ ${error.message}`);
    } finally {
      processing = false;
      if(gameStateQueue.length > 0 && !isProcessingErrors){
        processQueue()
      } else {
        cleanUpMessagesId = message.id;
        processErrorsAndSendMessages();
      }
    }
  }

  // process game state from Q league
  if(task.server === q_server){
    if(!q_bot_consts.allowDuplicates || q_bot_consts.writeToUniqueIdsFile){ // this is a check for duplicates. not needed when testing
      uniqueIdsFilePath = path.join(__dirname, "public", q_uniqueIdsFile)   // open and read .csv file for state duplications
      uniqueGameStateIds = fs.readFileSync(uniqueIdsFilePath, 'utf8')
        .split(",")
        .map(id => id.trim())
    }

    const { message, name, spreadsheetId } = task
    const sentProcessingMessage = await message.channel.send(`Processing: ${name}`)
    q_userProcessingMessages.push(sentProcessingMessage.id)
    let romData;
    try {
      const fileName = task.name;
      const gameFileURL = task.attachment;
      const fetchGameFile = await fetch(gameFileURL);
      const gameFileBuffer = await fetchGameFile.arrayBuffer();
      
      const romArgs = {
        file: gameFileBuffer,
        seasonNumber: q_seasonNumber,
        gameType: "season",
        leagueName: q_league,
        teamsDictCodes: q_teamCodes,
      };
      romData = await readOgRomBinaryGameState(romArgs);
      // Perform checks and processing as before
      const { 'GAME LENGTH': gameLength } = romData.data.otherGameStats;
      const gameLengthInt = parseInt(gameLength.replace(":", ""), 10);
      if(gameLengthInt < 1500){
        q_readingGameStateError.push(fileName)
        throw new Error(`Error: \`${fileName}\` is short of 15:00.`);
      }
  
        // check that both teams are not the same. 
        if(romData.data.otherGameStats.homeTeam === romData.data.otherGameStats.awayTeam){
          q_readingGameStateError.push(fileName)
          throw new Error(`Error: \`${fileName}\` home and away teams are the same.`)
        }
  
        let gamesUniqueId;
        let matchup;
        if(q_bot_consts.writeToUniqueIdsFile){ // if not writing to uniqueId's file then don't need to proceed here
          gamesUniqueId = romData.data.otherGameStats.uniqueGameId // begin duplication and schedule checks
          const isDuplicate = uniqueGameStateIds.includes(gamesUniqueId)
          if(isDuplicate){
            q_duplicateGameStateFileNames.push(fileName)
            throw new Error(`Error: \`${fileName}\` appears to be a duplicate.`)
          }
          // checks against schedule.
          matchup = gamesUniqueId.substring(2, 9);
          const matchupArray = [];
          uniqueGameStateIds.forEach(match => {
            if(match === matchup){
              matchupArray.push(match)
            }
          })
          // matchup array length is total games divided by 2 as these represent home and away series which totals total games.
          const isScheduleComplete = matchupArray.length >=2 ? true : false;
          if(isScheduleComplete){
            q_duplicateGameStateFileNames.push(fileName)
            throw new Error(`Error: \`${fileName}\` home/away sequence has been met for the schedule.`)
          }
        }
  
      // Handle file processing (e.g., generating boxscore, appending data to Google Sheets)
      const data = romData.data;
      const league = q_league;
      const generateBoxscore = createWorker('./lib/workers/scripts/createBoxscore.js', { data, __dirname, league });

      if(q_bot_consts.writeToGoogleSheets){
        // send game data to google sheets
        const sheetsArgsObj = {
          sheets,
          spreadsheetId,
          romData
        }
        try { // append to google sheets try block
          const googleSheetsResponse = await appendGoogleSheetsData(sheetsArgsObj);
          // if error returned throw error
          if(googleSheetsResponse && googleSheetsResponse.status === 'error'){
            throw new Error(googleSheetsResponse.message)
          }
          boxscoreImageGameId = googleSheetsResponse
        } catch (error) {
          q_googleSheetApiErrors.push(fileName)
          throw new Error(`\`${fileName}\` ${error.message}`)
        }
      }
  
      // after successful google sheets append
      if(q_bot_consts.writeToUniqueIdsFile){
        try {
          uniqueGameStateIds.push(gamesUniqueId); // Update the in-file array
          uniqueGameStateIds.push(matchup); // Update the in-file array
          fs.appendFileSync(uniqueIdsFilePath, `${gamesUniqueId},${matchup},`) 
        } catch (error) {
          throw new Error("Error occured in trying to write to uniqueId text file.")
        }
      }
  
      if(q_bot_consts.sendBoxscore) {
        const { status, image, errorMessage } = await generateBoxscore;
        if(status === "success") {
          const imageBuffer = Buffer.from(image);
          // games id to be used as the boxscore images file name
          const gamesUniqueId = romData.data.otherGameStats.uniqueGameId
          const seasonNumber = gamesUniqueId.slice(0,2)
          const imageFileName = `${seasonNumber}-${boxscoreImageGameId ?? 'test'}`
          const attachment = new AttachmentBuilder(imageBuffer, { name: `${imageFileName}.png` });
            if(q_sendResponseToOutputchannel) {
              await client.channels.cache.get(q_boxscoreOutputChannelId).send({ files: [attachment] });
            } else {
              await task.message.channel.send({ files: [attachment] });
            }
          }
          if(status === "error") {
            throw new Error(errorMessage);
          }
        }
  
      const sentCompleteMessage = await message.channel.send(`Complete: \`${name}\``)
      q_userProcessingMessages.push(sentCompleteMessage.id)
  
    } catch (error) {
      await message.channel.send(`❌ ${error.message}`);
    } finally {
      processing = false;
      if(gameStateQueue.length > 0 && !isProcessingErrors){
        processQueue()
      } else {
        q_cleanUpMessagesId = message.id;
        processErrorsAndSendMessages();
      }
    }
  }
}

async function processErrorsAndSendMessages (){
  isProcessingErrors = true;

  try {

    let userErrorMessage = "";

    // Build error messages for W league
    if (duplicateGameStateFileNames.length > 0) {
      const duplicateFileCount = duplicateGameStateFileNames.length;
      let duplicateStringMessage = duplicateGameStateFileNames.join("\n");
      userErrorMessage += `The following ${duplicateFileCount} game state(s) were NOT processed.\n\n\`${duplicateStringMessage}\`\n`;
    }

    if (googleSheetApiErrors.length > 0) {
      const googleErrorFileCount = googleSheetApiErrors.length;
      let googleSheetsAppendErrorStringMessage = googleSheetApiErrors.join("\n");
      userErrorMessage += `The following ${googleErrorFileCount} game state(s) were not processed.\n\`${googleSheetsAppendErrorStringMessage}\`\n`;
    }

    if (readingGameStateError.length > 0) {
      const gameParsingErrorCount = readingGameStateError.length;
      let gameParsingErrorStringMessage = readingGameStateError.join("\n");
      userErrorMessage += `The following ${gameParsingErrorCount} game state(s) were not processed.\n\`${gameParsingErrorStringMessage}\``;
    }
    let q_userErrorMessage = "";

    // Build error messages for Q league
    if (q_duplicateGameStateFileNames.length > 0) {
      const duplicateFileCount = q_duplicateGameStateFileNames.length;
      let duplicateStringMessage = q_duplicateGameStateFileNames.join("\n");
      q_userErrorMessage += `The following ${duplicateFileCount} game state(s) were NOT processed.\n\n\`${duplicateStringMessage}\`\n`;
    }

    if (q_googleSheetApiErrors.length > 0) {
      const googleErrorFileCount = q_googleSheetApiErrors.length;
      let googleSheetsAppendErrorStringMessage = q_googleSheetApiErrors.join("\n");
      q_userErrorMessage += `The following ${googleErrorFileCount} game state(s) were not processed.\n\`${googleSheetsAppendErrorStringMessage}\`\n`;
    }

    if (q_readingGameStateError.length > 0) {
      const gameParsingErrorCount = q_readingGameStateError.length;
      let gameParsingErrorStringMessage = q_readingGameStateError.join("\n");
      q_userErrorMessage += `The following ${gameParsingErrorCount} game state(s) were not processed.\n\`${gameParsingErrorStringMessage}\``;
    }
    // set channel to correct server

    const w_channel = client.channels.cache.get(saveStatesChannelId)

    const q_channel = client.channels.cache.get(q_saveStatesChannelId)

    // Send error message to the user in W league
    if (userErrorMessage) {
      await w_channel.send(
        `--------------------------\n${userErrorMessage}\n`
      );
      await cleanUpBotMessages(client, saveStatesChannelId, userProcessingMessages)
      await w_channel.send(
        `----End processing with issue(s)----`
      );
    } else {
      if(userProcessingMessages.length > 0){
        await cleanUpBotMessages(client, saveStatesChannelId, userProcessingMessages)
        const message = await w_channel.messages.fetch(cleanUpMessagesId);
        await message.react('✅')
      }
    }
    // Send error message to the user
    if (q_userErrorMessage) {
      await q_channel.send(
        `--------------------------\n${q_userErrorMessage}\n`
      );
      await cleanUpBotMessages(client, q_saveStatesChannelId, q_userProcessingMessages)
      await q_channel.send(
        `----End processing with issue(s)----`
      );
    } else {
      if(q_userProcessingMessages.length > 0){
        // arguments required for cleaning up bot messages
        await cleanUpBotMessages(client, q_saveStatesChannelId, q_userProcessingMessages)
        const message = await q_channel.messages.fetch(q_cleanUpMessagesId);
        await message.react('✅')
      }
    }

    // Clear error arrays
    userProcessingMessages.length = 0;
    duplicateGameStateFileNames.length = 0;
    googleSheetApiErrors.length = 0;
    readingGameStateError.length = 0;
    q_userProcessingMessages.length = 0;
    q_duplicateGameStateFileNames.length = 0;
    q_googleSheetApiErrors.length = 0;
    q_readingGameStateError.length = 0;
  } catch {
    console.log('catch block inside of processErrorsSendMessages needs to be adjusted...')
  } finally {
    isProcessingErrors = false; // Allow new processing to begin
    if (gameStateQueue.length > 0 && !processing) {
      processQueue(); // Restart queue processing if new files were added
    }
  }
};

client.on(Events.MessageCreate, async message => {
  if (message.author.bot && !message.webhookId) return;
  const getServerName = message.guild.name;
  const channelId = message.channel.id; 
  // set vars for W league
  if(getServerName === w_server){
    spreadsheetId = w_spreadsheetId;
  }
  
  // set vars for Q league
  if(getServerName === q_server){
    spreadsheetId = q_spreadsheetId
  }

  //////////////////////////////////
  // process pure league score input
  //////////////////////////////////
  
  if(getServerName === pureServer){ 
    // pure league score submissions block
    if(channelId === p_submitScoresChannelId){
      const pureArgs = {
        sheets,
        message
      }
      gameStateQueue.push({ server: pureServer, processPureArgs: pureArgs });
      if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
        processQueue()
      }
      return;
    }
    // season games listening block
     if(channelId === p_seasonGamesChannelId){
       const coachId = message.author.id
 
       const seasonGamesPattern = /^[Ss]eason [Gg]ames( ([1-9]|1[0-2])([0-5][0-9])?[APap][Mm])?$/
 
       if(seasonGamesPattern.test(message.content)){
         const userMessage = message.content
         const isMentionOpponentRequest = true
         gameStateQueue.push({isMentionOpponentRequest, server: getServerName, client, coachId, userMessage, p_seasonGamesChannelId})
         if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
           processQueue()
         }
         return;
     }
   }
  }
  
  //////////////////////////////////
  // end processing pure league
  //////////////////////////////////
  
  
  ////////////////////////////////////
  // W league processing
  ////////////////////////////////////
  
  if(getServerName === w_server){
    // check for W league admin commands

    if(channelId === adminsListeningChannelId){
      if(message.author.id === adminIdObject['ultramagnus'] || message.author.id === adminIdObject['ellis']){
        if(message.content){
          const adminMessage = message.content.split(" ");
          // check if in listening channel
          // check to see if admin is using a keyword to edit settings
          if(adminCommands.includes(adminMessage[0])){
            // used in processQueue to bypass if not admin keyword
            const isAdminInstruction = true;
            // check if admin is dropping in .csv files required for game state parsing
            const csvFile = {};
            if(message.attachments.first()){
              const csvFileNames = [
                process.env.goalieAttributes,
                process.env.skaterAttributes,
                process.env.teamPositionCounts
              ]
              const attachedFileName = message.attachments.first().name;
              if(csvFileNames.includes(attachedFileName)){
                csvFile.url = message.attachments.first().url;
                csvFile.fileName = message.attachments.first().name;
              } else {
                // return if file is not accepted
                return;
              }
            }           
              gameStateQueue.push({isAdminInstruction, server: getServerName, client, adminMessage, adminsListeningChannelId, csvFile, sheets})
              if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
                processQueue()
              }
              return
        }
        }
      }
    }

    // call for either season games or get remaining opponents list
    if(channelId === seasonGamesChannelId){
      // @ mention remaining opponents
      // check if mention request is jeelock
      let seasonGamesPattern
      const coachId = message.author.id
      const messageId = message.id

      const jeelockObject = coaches.find(coachObject => coachObject.team === 'SAG')
      if(jeelockObject && coachId === jeelockObject.id){
        seasonGamesPattern = /^[Ss]eason [Gg]ames([\s]([\S])*)*$/
      } else {
        seasonGamesPattern = /^[Ss]eason [Gg]ames( ([1-9]|1[0-2])([0-5][0-9])?[APap][Mm])?$/
      }
      if(seasonGamesPattern.test(message.content) && !isPlayoffs){
          const userMessage = message.content
          const isMentionOpponentRequest = true
          gameStateQueue.push({isMentionOpponentRequest, server: getServerName, client, coachId, messageId, userMessage, seasonGamesChannelId})
          if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
            processQueue()
          }
          return
      }
      // display remaining opponent logos
      const teamPattern = /^[A-Z]{3}$/
      if(teamPattern.test(message.content)){
          const isOpponentRequest = true
          const teamAbbreviation = message.content
          gameStateQueue.push({isOpponentRequest, server: getServerName, client, teamAbbreviation, message, seasonGamesChannelId})
          if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
            processQueue()
          }
          return
      }
      // opt out of being mentioned in season games calls
      const optOutOfBeingMentioned = /^fuck off$/i
      const optBackInOfBeingMentioned = /^fuck on$/i
      if(optOutOfBeingMentioned.test(message.content) || optBackInOfBeingMentioned.test(message.content)){
          const isOptOutOfBeingMentioned = true
          const coachId = message.author.id
          const messageContent = message.content
          gameStateQueue.push({isOptOutOfBeingMentioned, server: getServerName, client, coachId, messageContent, seasonGamesChannelId})
          if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
            processQueue()
          }
          return
      }
      // display remaining matches when season is down to 20 games
      
      const showGamesPattern = /^SHOW GAMES$/
      if(showGamesPattern.test(message.content)){
        const isShowEndOfScheduleRequest = true
        const coachId = message.author.id
        const messageContent = message.content
        gameStateQueue.push({isShowEndOfScheduleRequest, server: getServerName, client, coachId, messageContent, seasonGamesChannelId})
        if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
          processQueue()
        }
        return
      }
    }

    // begin processing W league saved states
    if (channelId !== saveStatesChannelId) return; // channel id obtained in Clientready event
    if (message.attachments.size < 1) return;
    // if bot is not on paused for W league then proceed to listen
    if(!pauseWLeague){
          const gameStates = [...message.attachments.values()].filter(state => {
            const isGameState = saveStateName.test(state.name) // exlcude if filename is not game file
            if(!isGameState) return false 
      
            const fileSize = state.size; // veryify file size is within range of a game state
            if(fileSize < 1000000 || fileSize > 1200000) return false
            
            return true
          })

          // sort game states by state number in order to have correct sheets and boxscore orders perserved
          gameStates.sort((a,b) => {
            const aState = parseInt(a.name.match(/state(\d{1,3})/)[1])
            const bState = parseInt(b.name.match(/state(\d{1,3})/)[1])
            return aState - bState
          })
      
          for (const gameState of gameStates) {
            gameStateQueue.push({ message, server: getServerName, spreadsheetId, name: gameState.name, attachment: gameState.attachment });
          }
      
          if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
            processQueue()
        }
    } else {
      const channel = client.channels.cache.get(saveStatesChannelId);
      await channel.send("⏸: BSB is currently on pause. Your state will be processed later.") 
    }    
  }
  ////////////////////////////////////
  // end W league processing
  ////////////////////////////////////

  ////////////////////////////////////
  // Q league processing
  ////////////////////////////////////

  if(getServerName === q_server){

    // check for Q league admin commands
    if(channelId === q_adminsListeningChannelId){
      if(message.author.id === q_adminIdObject['ultramagnus'] || message.author.id === q_adminIdObject['ellis']){
        if(message.content){
          const adminMessage = message.content.split(" ");
          // check if in listening channel
          // check to see if admin is using a keyword to edit settings
          if(q_adminCommands.includes(adminMessage[0])){
            // used in processQueue to bypass if not admin keyword
            const isAdminInstruction = true;
            // check if admin is dropping in .csv files required for game state parsing
            const csvFile = {};
            if(message.attachments.first()){
              const csvFileNames = [
                process.env.goalieAttributes,
                process.env.skaterAttributes,
                process.env.teamPositionCounts
              ]
              const attachedFileName = message.attachments.first().name;
              if(csvFileNames.includes(attachedFileName)){
                csvFile.url = message.attachments.first().url;
                csvFile.fileName = message.attachments.first().name;
              } else {
                // return if file is not accepted
                return;
              }
            }         
              gameStateQueue.push({isAdminInstruction, server: getServerName, client, adminMessage, q_adminsListeningChannelId, csvFile, sheets})
              if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
                processQueue()
              }
              return
        }
        }
      }
    }

    // call for either season games or get remaining opponents list
    if(channelId === q_seasonGamesChannelId){
      // @ mention remaining opponents
      const seasonGamesPattern = /^[Ss]eason [Gg]ames( ([1-9]|1[0-2])([0-5][0-9])?[APap][Mm])?$/
      if(seasonGamesPattern.test(message.content) && !q_isPlayoffs){
          const coachId = message.author.id
          const userMessage = message.content
          const isMentionOpponentRequest = true
          gameStateQueue.push({isMentionOpponentRequest, server: getServerName, client, coachId, userMessage, q_seasonGamesChannelId})
          if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
            processQueue()
          }
          return
      }
      // display remaining opponent logos
      const teamPattern = /^[A-Z]{3}$/
      if(teamPattern.test(message.content)){
          const isOpponentRequest = true
          const teamAbbreviation = message.content
          gameStateQueue.push({isOpponentRequest, server: getServerName, client, teamAbbreviation, q_seasonGamesChannelId})
          if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
            processQueue()
          }
          return
      }
    }

     // begin processing Q league saved states
    if (channelId !== q_saveStatesChannelId) return; // channel id obtained in Clientready event
    if (message.attachments.size < 1) return;
    // if bot is not on paused for W league then proceed to listen
    if(!q_pauseQLeague){
      
          const gameStates = [...message.attachments.values()].filter(state => {
            const isGameState = q_saveStateName.test(state.name) // exlcude if filename is not game file
            if(!isGameState) return false 
      
            const fileSize = state.size; // veryify file size is within range of a game state
            if(fileSize < 1000000 || fileSize > 1200000) return false
            
            return true
          })

          // sort game states by state number in order to have correct sheets and boxscore orders perserved
          gameStates.sort((a,b) => {
            const aState = parseInt(a.name.match(/state(\d{1,3})/)[1])
            const bState = parseInt(b.name.match(/state(\d{1,3})/)[1])
            return aState - bState
          })
      
          for (const gameState of gameStates) {
            gameStateQueue.push({ message, server: getServerName, spreadsheetId, name: gameState.name, attachment: gameState.attachment });
          }
      
          if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
            processQueue()
        }
    } else {
      const channel = client.channels.cache.get(q_saveStatesChannelId);
      await channel.send("⏸: BSB is currently on pause. Your state will be processed later.") 
    }   

  }

  ////////////////////////////////////
  // end Q league processing
  ////////////////////////////////////
  });


client.login(token);