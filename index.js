import fs from "node:fs"
import path from "node:path";
import { fileURLToPath } from 'url';
import { google } from "googleapis";
import { Client, Events, GatewayIntentBits } from 'discord.js';
// lib files
import { allowedGuilds, pure_consts, p_bot_consts_update_emitter, } from "./lib/constants/consts.js";
// pure files
import processPure from "./lib/pureLeague/processPure.js";
import setPureSettings from "./lib/pureLeague/setPureSettings.js"
import mentionRemainingOpponents from "./lib/index/mentionRemainingOpponents.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    p_seasonGamesChannelId = p_guild.channels.cache.find(channel => channel.name === p_seasonGamesChannel)?.id || null
    // submit scores listening channel id
    p_submitScoresChannelId = p_guild.channels.cache.find(channel => channel.name === p_submitScoresChannel)?.id || null
  }
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

client.on(Events.GuildCreate, async (guild) => {
  if (!allowedGuilds.includes(guild.id)) {
    console.log(`Unauthorized guild detected: ${guild.name} (${guild.id})`);

    try {
      await guild.leave();
      console.log(`Left unauthorized guild: ${guild.name}`);
    } catch (error) {
      console.error(`Failed to leave unauthorized guild:`, error);
    }
  }
})

let sheets;
let spreadsheetId
let w_spreadsheetId
let q_spreadsheetId
let uniqueIdsFilePath
let uniqueGameStateIds = []
let adminsListeningChannelId // channel that listens for admin commands
let saveStatesChannelId // get the channel the bot will be listening in.
let boxscoreOutputChannelId // the channel that the boxscores will be sent to
let seasonGamesChannelId
let boxscoreImageGameId // puss request for ticklebots

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

client.once(Events.ClientReady, async() => { // obtain the channel id for the channel that is being listened to
  console.log(`Logged in as ${client.user.tag}!`);

  // Leave any guild that is not explicitly authorized
  for (const guild of client.guilds.cache.values()) {
    if (!allowedGuilds.includes(guild.id)) {
      console.log(`Removing bot from unauthorized guild: ${guild.name} (${guild.id})`);

      try {
        await guild.leave();
        console.log(`Successfully left ${guild.name}`);
      } catch (error) {
        console.error(`Failed to leave ${guild.name}:`, error);
      }
    }
  }

  // get P server
  const p_guild = client.guilds.cache.find(guild => guild.name === pureServer);
  if(p_guild){
        // begin connections to google sheets
        const serviceAccount = JSON.parse(fs.readFileSync("./serviceKeys.json"));

        // Initialize the Sheets API client in the main thread
        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        sheets = google.sheets({ version: "v4", auth });

      // channel listening for save states
      const p_submitScoresListeningChannel = p_guild.channels.cache.find(channel => channel.name === p_submitScoresChannel)
      if(p_submitScoresListeningChannel){
        p_submitScoresChannelId = p_submitScoresListeningChannel.id;
      } else {
        console.log(`Channel p_saveStatesListeningChannel not found.`)
      }

      // channel for outputting remaining opponents
      const p_remaining_opponents_output_channel = p_guild.channels.cache.find(channel => channel.name === p_seasonGamesChannel)
      if(p_remaining_opponents_output_channel){
        p_seasonGamesChannelId = p_remaining_opponents_output_channel.id;
      } else {
        console.log(`Channel p_seasonGamesChannelId' not found.`)
      }
    } else {
      console.log(`${pureServer} can't be found.`)
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

    if(server === pureServer){
      const { p_seasonGamesChannelId } = task
      // get q constants
      const pFilePath = path.join(__dirname, "public", "json", "pure_bot_constants.json")
      const readPFile = fs.readFileSync(pFilePath, "utf-8")
      const p_bot_consts = JSON.parse(readPFile)
      
      // get gamesplayed data from unique id's file
      const p_uniqueIdsFilePath = path.join(__dirname, "public", "pUniqueIds.csv")
      const uniqueIdsFile = fs.readFileSync(p_uniqueIdsFilePath, "utf-8")

      const { teamCodesList: teamCodes, coaches } = p_bot_consts
      await mentionRemainingOpponents(p_seasonGamesChannelId, p_excludeCoaches, {server, client, coachId, teamCodes, userMessage, coaches, uniqueIdsFile})
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
      if(message.author.id === p_adminIdObject['ticklepuss'] || message.author.id === p_adminIdObject['ellis']){
        setPureSettings(processPureArgs)
      }
      processing = false;
    } else {
      // process a score entry
      await processPure(processPureArgs)
      processing = false;
    }
  }
}

client.on(Events.MessageCreate, async message => {
  if (!message.guild || !allowedGuilds.includes(message.guild.id)) return;
  if (message.author.bot && !message.webhookId) return;
  const getServerName = message.guild.name;
  const channelId = message.channel.id; 

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

  });


client.login(token);