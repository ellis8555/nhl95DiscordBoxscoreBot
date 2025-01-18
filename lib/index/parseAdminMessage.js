import fs from "node:fs";
import path from "node:path";

async function parseAdminMessage({server, adminMessage, client, adminBoxscoreChannelId}){

    const channel = client.channels.cache.find(c => c.id === adminBoxscoreChannelId)
    const w_server = process.env.server;
    let writeToFile = false;

    let response;
    if(server === w_server){
        const filePath = path.join(process.cwd(), "public", "json", "bot_constants.json")
        const readFile = fs.readFileSync(filePath, "utf-8")
        const serverConsts = JSON.parse(readFile);
        switch(adminMessage[0]){
            case "PAUSE":
                serverConsts.pauseWLeague = true;
                writeToFile = true
                response = "Boxscore Bot has been paused."
            break;
            case "RESUME":
                serverConsts.pauseWLeague = false;
                writeToFile = true
                response = "Boxscore Bot resumed.";
            break;
            case "GET":
                switch(adminMessage[1]){
                    case "SETTINGS":
                        writeToFile = false;
                        const settings = {
                            pauseWLeague: serverConsts["pauseWLeague"],
                            allowDuplicates: serverConsts["allowDuplicates"],
                            writeToUniqueIdsFile: serverConsts["writeToUniqueIdsFile"],
                            writeToGoogleSheets: serverConsts["writeToGoogleSheets"],
                            sendBoxscore: serverConsts["sendBoxscore"],
                        };                       
                        response = JSON.stringify(settings, null, 2)
                    break;
                    case "KEYWORDS":
                        writeToFile = false
                        response = JSON.stringify(serverConsts.adminKeywords, null, 2)
                    break;
                    case "OUTPUT":
                        if(adminMessage[2] === "CHANNEL"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.outputChannel, null, 2)
                        }
                    case "INPUT":
                        if(adminMessage[2] === "CHANNEL"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.listeningChannel, null, 2)
                        }
                    case "SEASON":
                        if(adminMessage[2] === "NUMBER"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.seasonNum, null, 2)
                        }
                    case "SAVE":
                        if(adminMessage[2] === "STATE"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.saveStatePattern, null, 2)
                        }
                    case "TEAMCODES":
                            writeToFile = false
                            response = JSON.stringify(serverConsts.teamCodes, null, 2)
                    break;
                    default:
                        response = "Keyword not found."
                }               
            break;
            case "SET":

            break;
            default:
                return;
        }

        if(writeToFile){
            try {            
                const updatedServerConsts = JSON.stringify(serverConsts, null, 2);
                fs.writeFileSync(filePath, updatedServerConsts, {encoding: "utf-8"})
                await channel.send(response)
            } catch (error) {
               await channel.send("Error in writing to the settings file.") 
            }
        } else {
            await channel.send(response)
        }
    }
}

export default parseAdminMessage;