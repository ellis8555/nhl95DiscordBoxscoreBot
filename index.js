import fs from "node:fs"
import path from "node:path";
import { fileURLToPath } from 'url';
import { google } from "googleapis";
import { AttachmentBuilder, Client, Events, GatewayIntentBits } from 'discord.js';
// lib files
import readOgRomBinaryGameState from './lib/game-state-parsing/read-og-rom-game-state.js';
import appendGoogleSheetsData from "./lib/google-sheets/appendGoogleSheetsData.js"
import createWorker from "./lib/workers/createWorker.js";
import { teamCodes } from "./lib/game-state-parsing/teamcodes.js";
import { bot_consts } from "./lib/constants/consts.js";

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
  writeToGoogleSheets
} = bot_consts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uniqueIdsFile = uniqueIdsFileName
const channelName = listeningChannel
const outputChannelName = outputChannel
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

let sheets;
let spreadsheetId;
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

client.on(Events.MessageCreate, async message => {
  if (message.channel.id !== adminBoxscoreChannelId) return; // channel id obtained in Clientready event
  if (message.author.bot) return;
  if (message.attachments.size < 1) return;

  const duplicateGameStateFileNames = []; // holds fileNames for states that are duplicates
  const readingGameStateError = [] // holds errors related to reading in the game file
  const googleSheetApiErrors = [];  // holds references to any errors during game appends

  const gameStates = [...message.attachments.values()].filter(state => {
    const isGameState = saveStateName.test(state.name)
    if(!isGameState) return false

    const fileSize = state.size; // veryify file size is within range of a game state
    if(fileSize < 1000000 || fileSize > 1200000) return false
    
    return true
  })
  
    // begin to process the actual files

  for (const gameState of gameStates){
    let romData;
    await message.channel.send(`Processing: ${gameState.name}`)
    const fileName = gameState.name;
    try { // catch all try block
      try { // game parsing try block       
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
        romData = await readOgRomBinaryGameState(romArgs)
      } catch (error) {
        readingGameStateError.push(fileName)
        throw new Error(`Error: ${fileName} could not be parsed properly.`)
      }

      
      if(writeToUniqueIdsFile){ // write game id's to .csv files when true
        const gamesUniqueId = romData.data.otherGameStats.uniqueGameId // begin duplication and schedule checks
        const isDuplicate = uniqueGameStateIds.includes(gamesUniqueId)
        const matchup = gamesUniqueId.substring(2, 9);
        const isHomeAwayDuplicated = uniqueGameStateIds.includes(matchup)
        if(isDuplicate || isHomeAwayDuplicated){
          duplicateGameStateFileNames.push(fileName)
          continue;
        }
        
        fs.appendFileSync(uniqueIdsFilePath, `${gamesUniqueId},${matchup},`)
        uniqueGameStateIds.push(gamesUniqueId); // Update the in-memory array
        uniqueGameStateIds.push(matchup); // Update the in-memory array
      }
      
      const data = romData.data; // hand boxscore processing to worker
      const generateBoxscore = createWorker('./lib/workers/scripts/createBoxscore.js', {data, __dirname})

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
          // don't need to throw an error so boxscore can still be produced in next lines
          googleSheetApiErrors.push(fileName)
        }
      }

      const { status, image } = await generateBoxscore;
      if (status === "success") {
          const imageBuffer = Buffer.from(image)
          const attachment = new AttachmentBuilder(imageBuffer, { name: 'boxscore.png' });
          await message.channel.send(`Processed - ${gameState.name} - COMPLETE`)

          if(sendResponseToOutputchannel){ // send to a different channel from where the game state was uploaded
            await client.channels.cache.get(outputChannelId).send({files: [attachment] });  // this outputs to boxscore channel
          } else { // send to same channel in which the state was submitted.
            await message.channel.send({files: [attachment] }); // this is channel where states are posted
          }
      }
    }catch(error){
      await message.channel.send(error.message)
    }
  }

  let userErrorMessage = ""

  // display user message game state duplications or home/away error
  if(duplicateGameStateFileNames.length > 0){
    const duplicateFileCount = duplicateGameStateFileNames.length;
    let duplicateStringMessage = "";
    duplicateGameStateFileNames.forEach(file => {
      duplicateStringMessage += `${file}\n`;
    })

    userErrorMessage += `The following ${duplicateFileCount} game state(s) were NOT processed.\nDuplication or home/away did not switch.\n\`${duplicateStringMessage}\``
  }

// display user message games that were not added to google sheets
if(googleSheetApiErrors.length > 0){
  const googleErrorFileCount = googleSheetApiErrors.length;
  let googleSheetsAppendErrorStringMessage = "";
  googleSheetApiErrors.forEach(file => {
    googleSheetsAppendErrorStringMessage += `${file}\n`;
  })
    userErrorMessage += `The following ${googleErrorFileCount} game state(s) were not appended to google sheets.\n\`${googleSheetsAppendErrorStringMessage}\`\n\n`
}

if(readingGameStateError.length > 0){
  const gameParsingErrorCount = readingGameStateError.length;
  let gameParsingErrorStringMessage = "";
  readingGameStateError.forEach(file => {
    gameParsingErrorStringMessage += `${file}\n`;
  })
  userErrorMessage += `The following ${gameParsingErrorCount} game state(s) were not appended to google sheets.\n\`${gameParsingErrorStringMessage}\`\n\n`
}

// let user know which events did not occur on which states
if(userErrorMessage === ""){ // no errors occured
  await message.channel.send(`\n\nGoogle test sheet tabs appended.\nEnd processing files.`)
} else { // if errors occured
  await message.channel.send('\n\n' + userErrorMessage + '\nEnd processing files')
}
});

client.login(token);