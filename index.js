import fs from "node:fs"
import path from "node:path";
import { fileURLToPath } from 'url';
import { google } from "googleapis";
import { AttachmentBuilder, Client, Events, GatewayIntentBits } from 'discord.js';
// lib files
import readOgRomBinaryGameState from './lib/game-state-parsing/read-og-rom-game-state.js';
import appendGoogleSheetsData from "./lib/google-sheets/appendGoogleSheetsData.js"
import createWorker from "./lib/workers/createWorker.js";
import { bot_consts } from "./lib/constants/consts.js";
// pure files
import processPure from "./lib/pureLeague/processPure.js";
import { channel } from "node:diagnostics_channel";

const {  
  token,
  uniqueIdsFileName,  
  server,
  listeningChannel, 
  outputChannel, 
  saveStatePattern, 
  leagueName,
  seasonNum,
  sendResponseToOutputchannel,
  allowDuplicates,
  writeToUniqueIdsFile,
  writeToGoogleSheets,
  sendBoxscore,
  teamCodes
} = bot_consts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uniqueIdsFile = uniqueIdsFileName
const channelName = listeningChannel
const outputChannelName = outputChannel
const saveStateName = saveStatePattern
const league = leagueName
const seasonNumber = seasonNum

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
let adminBoxscoreChannelId; // get the channel the bot will be listening in.
let outputChannelId; // the channel that the boxscores will be sent to

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

  // process incoming tasks from pure league
  if(task.server === pureServer){
    const { processPureArgs } = task
    await processPure(processPureArgs)
    processing = false;
    return;
  }

  if(!allowDuplicates || writeToUniqueIdsFile){ // this is a check for duplicates. not needed when testing
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
      teamsDictCodes: teamCodes
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
      if(writeToUniqueIdsFile){ // if not writing to uniqueId's file then don't need to proceed here
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

    if(writeToGoogleSheets){
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
    if(writeToUniqueIdsFile){
      try {
        uniqueGameStateIds.push(gamesUniqueId); // Update the in-file array
        uniqueGameStateIds.push(matchup); // Update the in-file array
        fs.appendFileSync(uniqueIdsFilePath, `${gamesUniqueId},${matchup},`) 
      } catch (error) {
        throw new Error("Error occured in trying to write to uniqueId text file.")
      }
    }

    if(sendBoxscore) {
      const { status, image, errorMessage } = await generateBoxscore;
      if(status === "success") {
        const imageBuffer = Buffer.from(image);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'boxscore.png' });
          if(sendResponseToOutputchannel) {
            await client.channels.cache.get(outputChannelId).send({ files: [attachment] });
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
      userErrorMessage += `The following ${gameParsingErrorCount} game state(s) were not processed.\n\`${gameParsingErrorStringMessage}\`\n`;
    }

    // Send error message to the user
    if (userErrorMessage) {
      await client.channels.cache.get(adminBoxscoreChannelId).send(
        `--------------------------\n${userErrorMessage}\nEnd processing files`
      );
      await cleanUpBotMessages(channelId)
      await client.channels.cache.get(adminBoxscoreChannelId).send(
        `----End processing files----`
      );
    } else {
      await cleanUpBotMessages(channelId)
      const channel = client.channels.cache.get(adminBoxscoreChannelId)
      const message = await channel.messages.fetch(messageId);
      await message.react('✅')
      await channel.send("----End processing files----");
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

async function cleanUpBotMessages(channelId){
      // begin deleting bot response messages for clean up touch
      const discordChannel = client.channels.cache.get(channelId);

      for(const messageId of userProcessingMessages){
          const message = await discordChannel.messages.fetch(messageId);
          await message.delete();
      }
}

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  const getServerName = message.guild.name;

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

    if (message.channel.id !== adminBoxscoreChannelId) return; // channel id obtained in Clientready event
    if (message.attachments.size < 1) return;

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
  });

client.login(token);