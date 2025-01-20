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
import { bot_consts, bot_consts_update_emitter } from "./lib/constants/consts.js";
// pure files
import processPure from "./lib/pureLeague/processPure.js";
import parseAdminMessage from "./lib/index/parseAdminMessage.js";

const {  
  token,
  uniqueIdsFileName,  
  server,
  leagueName,
  sendResponseToOutputchannel,
} = bot_consts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uniqueIdsFile = uniqueIdsFileName
const league = leagueName
let adminsListeningChannelName = bot_consts.adminsListeningChannel
let saveStatesListeningChannelName = bot_consts.saveStatesListeningChannel
let boxscoreOutputChannelName = bot_consts.boxscoreOutputChannel
let saveStateName = new RegExp(bot_consts.saveStatePattern)
let seasonNumber = bot_consts.seasonNum
let teamCodes = bot_consts.teamCodes
let adminIdObject = bot_consts.editPermission
let adminCommands = bot_consts.adminCommands

// update variables that come from admin within discord channel
bot_consts_update_emitter.on("bot_consts_update_emitter", (updatedConsts) => {
  saveStatesListeningChannelName = updatedConsts.saveStatesListeningChannel
  boxscoreOutputChannelName = updatedConsts.boxscoreOutputChannel
  adminsListeningChannelName = updatedConsts.adminsListeningChannel
  saveStateName = new RegExp(updatedConsts.saveStatePattern)
  seasonNumber = updatedConsts.seasonNum
  teamCodes = updatedConsts.teamCodes
  adminIdObject = updatedConsts.editPermission
  adminCommands = updatedConsts.adminCommands
  // updates channel in which the boxscores will be posted
  const guild = client.guilds.cache.find(guild => guild.name === server);
  boxscoreOutputChannelId = guild.channels.cache.find(channel => channel.name === boxscoreOutputChannelName).id;
  // admins commands channel id
  adminsListeningChannelId = guild.channels.cache.find(channel => channel.name === adminsListeningChannelName).id
  // save states listening channels id
  saveStatesChannelId = guild.channels.cache.find(channel => channel.name === saveStatesListeningChannelName).id;
})

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
let spreadsheetId;
let uniqueIdsFilePath;
let uniqueGameStateIds;
let adminsListeningChannelId; // channel that listens for admin commands
let saveStatesChannelId; // get the channel the bot will be listening in.
let boxscoreOutputChannelId; // the channel that the boxscores will be sent to

const gameStateQueue = []; // holds incoming game states to be processed
let processing = false; // checks if game state is currently being processed from the queue;
let isProcessingErrors = false; // checks if bot is performing error message tasks

const userProcessingMessages = []; // holds id of processing/complete messages in order to be cleaned up
const duplicateGameStateFileNames = []; // holds fileNames for states that are duplicates
const readingGameStateError = [] // holds errors related to reading in the game file
const googleSheetApiErrors = [];  // holds references to any errors during game appends

client.once(Events.ClientReady, () => { // obtain the channel id for the channel that is being listened to
  console.log(`Logged in as ${client.user.tag}!`);

  const guild = client.guilds.cache.find(guild => guild.name === server);
  if(guild){
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

    // begin connections to google sheets
    const serviceAccount = JSON.parse(fs.readFileSync("./serviceKeys.json"));

    // Initialize the Sheets API client in the main thread
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    sheets = google.sheets({ version: "v4", auth });
    spreadsheetId = process.env.spreadSheetId;
  } else {
    console.log(`${server} server not found.`)
  }
});

async function processQueue (){
  if(gameStateQueue.length === 0 || processing || isProcessingErrors) {
    return; // If queue is empty or processing a file;
  }
  processing = true; // processing is occuring
  const task = gameStateQueue.shift(); // Get the first file in the queue

  // process admin tasks W
  if(task.isAdminInstruction){
    const { server, adminMessage, csvFile } = task;
    await parseAdminMessage({server, adminMessage, adminsListeningChannelId, client, csvFile})
    processing = false;
    return;
  }

  // process incoming tasks from pure league
  if(task.server === pureServer){
    const { processPureArgs } = task
    await processPure(processPureArgs)
    processing = false;
    return;
  }

  if(!bot_consts.allowDuplicates || bot_consts.writeToUniqueIdsFile){ // this is a check for duplicates. not needed when testing
    uniqueIdsFilePath = path.join(__dirname, "public", uniqueIdsFile)   // open and read .csv file for state duplications
    uniqueGameStateIds = fs.readFileSync(uniqueIdsFilePath, 'utf8')
      .split(",")
      .map(id => id.trim())
  }

  const { message, name } = task
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
      leagueName: league,
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
    const generateBoxscore = createWorker('./lib/workers/scripts/createBoxscore.js', { data, __dirname });

    if(bot_consts.writeToGoogleSheets){
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
      } catch (error) {
        throw new Error("Error occured in trying to write to uniqueId text file.")
      }
    }

    if(bot_consts.sendBoxscore) {
      const { status, image, errorMessage } = await generateBoxscore;
      if(status === "success") {
        const imageBuffer = Buffer.from(image);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'boxscore.png' });
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
      const channelId = task.message.channelId
      const messageId = message.id;
      processErrorsAndSendMessages(channelId, messageId);
    }
  }
}

async function processErrorsAndSendMessages (channelId, messageId){
  isProcessingErrors = true;

  try {

    let userErrorMessage = "";

    // Build error messages
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

    const channel = client.channels.cache.get(saveStatesChannelId)
    // arguments required for cleaning up bot messages
    const cleanUpBotMessagesArgs = {
      client,
      channelId,
      userProcessingMessages
    }
    // Send error message to the user
    if (userErrorMessage) {
      await channel.send(
        `--------------------------\n${userErrorMessage}\n`
      );
      await cleanUpBotMessages(cleanUpBotMessagesArgs)
      await channel.send(
        `----End processing with issue(s)----`
      );
    } else {
      await cleanUpBotMessages(cleanUpBotMessagesArgs)
      const message = await channel.messages.fetch(messageId);
      await message.react('✅')
    }

    // Clear error arrays
    userProcessingMessages.length = 0;
    duplicateGameStateFileNames.length = 0;
    googleSheetApiErrors.length = 0;
    readingGameStateError.length = 0;
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
  if (message.author.bot) return;
  
  const getServerName = message.guild.name;
  const channelId = message.channel.id;
  
    ////////////////////////////////////
  // check for admin commands
  ////////////////////////////////////
  
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
          } else {
            const adminChannel = client.channels.cache.get(adminsListeningChannelId);
            await adminChannel.send("In order to upload a csv file a file needs to dropped in the channel with proper command as the text.")
            // return if not file provided
            return
          }
            
            gameStateQueue.push({isAdminInstruction, server: getServerName, adminMessage, adminsListeningChannelId, csvFile})
            if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
              processQueue()
            }
            return
      }
      }
    }
  }

  ////////////////////////////////////
  // end check for admin commands
  ////////////////////////////////////

  //////////////////////////////////
  // process pure league score input
  //////////////////////////////////
  
  if(getServerName === pureServer){ 
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
  
  //////////////////////////////////
  // end processing pure league
  //////////////////////////////////

  if (channelId !== saveStatesChannelId) return; // channel id obtained in Clientready event
  if (message.attachments.size < 1) return;
  // if bot is not on paused for W league then proceed to listen
  if(!bot_consts.pauseWLeague){
    
        const gameStates = [...message.attachments.values()].filter(state => {
          const isGameState = saveStateName.test(state.name) // exlcude if filename is not game file
          if(!isGameState) return false 
    
          const fileSize = state.size; // veryify file size is within range of a game state
          if(fileSize < 1000000 || fileSize > 1200000) return false
          
          return true
        })
    
        for (const gameState of gameStates) {
          gameStateQueue.push({ message, server: getServerName, name: gameState.name, attachment: gameState.attachment });
        }
    
        if(gameStateQueue.length > 0 && !processing && !isProcessingErrors){
          processQueue()
      }
  } else {
    const channel = client.channels.cache.get(saveStatesChannelId);
    await channel.send("⏸: BSB is currently on pause. Your state will be processed later.") 
  }
  });

client.login(token);