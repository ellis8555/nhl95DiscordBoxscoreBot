import fs from "node:fs";
import path from "node:path";

async function parseAdminMessage(adminsListeningChannelId, {server, adminMessage, client, csvFile}){
    const channel = client.channels.cache.get(adminsListeningChannelId)
    const w_server = process.env.server
    const q_server = process.env.qServer
    let writeToFile = false
    let writeToCsvFile = false

    let response;
    // W league server
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
                            adminListeningChannel: serverConsts["adminsListeningChannel"],
                            saveStatesListeningChannel: serverConsts["saveStatesListeningChannel"],
                            boxscoreOutputChannel: serverConsts["boxscoreOutputChannel"],
                            saveStatePattern: serverConsts["saveStatePattern"],
                            pauseWLeague: serverConsts["pauseWLeague"],
                            allowDuplicates: serverConsts["allowDuplicates"],
                            writeToUniqueIdsFile: serverConsts["writeToUniqueIdsFile"],
                            writeToGoogleSheets: serverConsts["writeToGoogleSheets"],
                            sendBoxscore: serverConsts["sendBoxscore"],
                        };                       
                        response = JSON.stringify(settings, null, 2)
                    break;
                    case "COMMANDS":
                        // Remove 'GET', 'SET' from list to be displayed in discord.
                        serverConsts.adminCommands.splice(2,2)
                        serverConsts.adminCommands[0] = "PAUSE - pauses BSB. Game state uploads are ignored. Admin commands still work."
                        serverConsts.adminCommands[1] = "RESUME - resumes BSB. Game state uploads will be processed"
                        
                        writeToFile = false
                        response = `${JSON.stringify(serverConsts.adminCommands, null, 2)}`
                    break;
                    case "SEASON":
                        if(adminMessage[2] === "NUMBER"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.seasonNum, null, 2)
                        }
                        break;
                    case "TEAMCODES":
                            writeToFile = false
                            response = JSON.stringify(serverConsts.teamCodes, null, 2)
                    break;
                    default:
                        response = "Keyword not found."
                }               
            break;
            case "SET":
                switch(adminMessage[1]){
                    case "DUPLICATES":
                        if(adminMessage[2] === "TRUE"){
                            serverConsts.allowDuplicates = true
                            serverConsts.writeToUniqueIdsFile = false
                        } else if(adminMessage[2] === "FALSE") {
                            serverConsts.allowDuplicates = false
                            serverConsts.writeToUniqueIdsFile = true
                        } else {
                            writeToFile = false;
                            response = "Setting needs to be either 'TRUE' or 'FALSE'."
                        }
                        writeToFile = true
                        response = `Allowing duplicates is ${adminMessage[2]}.\nWrite to unique file list set to ${adminMessage[2] === "TRUE"? "false":"true"}.`
                    break;
                    case "SHEETS":
                        if(adminMessage[2] === "TRUE"){
                            serverConsts.writeToGoogleSheets = true
                        } else if(adminMessage[2] === "FALSE") {
                            serverConsts.writeToGoogleSheets = false
                        }
                        writeToFile = true
                        response = `Writing to google sheets has been ${adminMessage[2] === "TRUE"? "enabled":"disabled"}.`
                    break;
                    case "BOXSCORE":
                        if (adminMessage[2] === "TRUE") {
                            serverConsts.sendBoxscore = true;
                            writeToFile = true;
                            response = `Creating boxscore image has been enabled.`;
                        } else if (adminMessage[2] === "FALSE") {
                            serverConsts.sendBoxscore = false;
                            writeToFile = true;
                            response = `Creating boxscore image has been disabled.`;
                        } else if (adminMessage[2] === "CHANNEL") {
                            if (adminMessage[3]) {
                                const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                                if (searchForChannel) {
                                    serverConsts.boxscoreOutputChannel = adminMessage[3];
                                    writeToFile = true;
                                    response = `Boxscores listening channel has been edited to ${adminMessage[3]}`;
                                } else {
                                    writeToFile = false;
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`;
                                }
                            } else {
                                writeToFile = false;
                                response = `A name for the new output channel needs to be provided.`;
                            }
                        } else {
                            writeToFile = false;
                            response = "Must be either TRUE, FALSE, or CHANNEL.";
                        }
                        break;  
                    case "ADMIN":
                        if(adminMessage[2] === "CHANNEL"){
                            const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                            if(searchForChannel){
                                serverConsts.adminsListeningChannel = adminMessage[3];
                                writeToFile = true;
                                response = `Admin listening channel has been edited to ${adminMessage[3]}`
                            } else {
                                writeToFile = false;
                                if(adminMessage[3]){
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                                } else {
                                    writeToFile = false;
                                    response = `A new channel name needs to be provided.`
                                }
                            }
                        } else {
                            writeToFile = false;
                            response = `The command for setting a new admins input channel is \`SET ADMIN INPUT CHANNEL new-admin-input-channel-name\`.`
                        }
                    break;
                    case "STATE":
                        if(adminMessage[2] === "CHANNEL" && adminMessage[3]){
                            const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                            if(searchForChannel){
                                serverConsts.saveStatesListeningChannel = adminMessage[3];
                                writeToFile = true;
                                response = `Listening channel has been edited to ${adminMessage[3]}`
                            } else {
                                writeToFile = false;
                                response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                            }
                        } else {
                            writeToFile = false
                            response = `A name for new channel needs to be provided.`
                        }
                    break;
                    case "SAVE":
                        if(adminMessage[2] === "STATE" && adminMessage[3]){
                            if(adminMessage[3].length > 5){
                                writeToFile = false
                                response = `Can't be more than 5 characters. Should be something like W13 or WP13 (playoffs).`
                            } else {
                                serverConsts.saveStatePattern = `^${adminMessage[3]}.*\\.state\\d{1,3}$`
                                writeToFile = true
                                response = `The new save state to be accepted is \`${serverConsts.saveStatePattern}\``
                            }
                        } else {
                            writeToFile = false
                            response = "To edit the save state name the command is `SAVE STATE` followed by league and season number."
                        }
                    break;
                    case "SEASON":
                        if(adminMessage[2]){
                            const numberCheckPattern = /^\d{1,2}$/
                            const isNumber = numberCheckPattern.test(adminMessage[2]);
                            if(isNumber){
                                serverConsts.seasonNum = adminMessage[2];
                                writeToFile = true
                                response = `Season number has been updated to ${adminMessage[2]}`
                            }else{
                                writeToFile = false
                                response = "Only digits are accepted"
                            }
                        }
                    break;
                    case "TEAMCODES":
                        if(adminMessage[2]){
                            const listPattern = /^([A-Z]{3},){1,35}[A-Z]{3}$/
                            const isListValid = listPattern.test(adminMessage[2]);
                            if(isListValid){
                                const teamsList = adminMessage[2].split(",")
                                serverConsts.teamCodes = teamsList
                                writeToFile = true;
                                response = `Team codes list has been updated. Run "GET TEAMCODES" to veryify.`
                            } else {
                                writeToFile = false
                                response = `Double check the list of teams is correctly formatted. It has to be 1-35 in length, uppercase letters, and comma seperated with no comma at the beginning or end.`
                            }
                        } else {
                            writeToFile = false
                            response = `A comma seperated list of team abbreviations needs to be provided after the keyword 'TEAMCODES'.\nEach team code needs to be 3 uppercase letters.\nDo not start or end the list with a comma.\nEx. SET TEAMCODES AHC,AUT,BAY`
                        }
                    break;
                    case "ROM":
                        if(adminMessage[2] === "CSV"){
                            let leagueName;
                            let seasonNumber;
                            // league name entry
                            if(adminMessage[3]){
                                const leagueNamePattern = /^[A-Z]$/;
                                const isValidLeagueName = leagueNamePattern.test(adminMessage[3]);
                                if(!isValidLeagueName){
                                    writeToFile = false
                                    response = `The league name should be one uppercase letter`
                                }
                            // season number entry
                            if(adminMessage[4]){
                                const seasonNumberPattern = /^[0-9]{1,2}$/;
                                const isValidSeasonNumber = seasonNumberPattern.test(adminMessage[4]);
                                if(!isValidSeasonNumber){
                                    writeToFile = false
                                    response = `Season number needs to be 1 or 2 digits in length`
                                }
                            }

                            leagueName = adminMessage[3]
                            seasonNumber = adminMessage[4]

                            // check a file was even attached
                            const { url, fileName } = csvFile
                            if(!url || !fileName){
                                writeToFile = false;
                                response = `A file needs to be attached with this command.`
                            } else {
                                const csvFilePath = path.join(process.cwd(), "lib", "game-state-parsing", "read-csv", "csv", leagueName, seasonNumber)                            
                                const getCsvFile = await fetch(url);
                                const csvFileContents = await getCsvFile.text();
    
                                try {
                                    fs.mkdirSync(csvFilePath, {recursive: true})
                                } catch (error) {
                                    writeToFile = false;
                                    response = `Failed to create the directory.`
                                    break;
                                }
    
                                try {                                
                                    const csvFileFullPath = path.join(csvFilePath, fileName)
                                    fs.writeFileSync(csvFileFullPath, csvFileContents, {encoding: "utf-8"})                          
                                } catch (error) {
                                    writeToFile = false;
                                    response = `Failed to upload ${fileName}.`
                                    break;
                                }
    
                                writeToCsvFile = true;
                                response = `${fileName} has been uploaded.`
                            }
                            } else {
                                writeToFile = false
                                response = `A league name and season number are required`
                            }
                        }
                    break;
                }
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
        } else if(writeToCsvFile){
            await channel.send(response)
        } else {
            await channel.send(response)
        }
    }

    // Q league server
    if(server === q_server){
        const filePath = path.join(process.cwd(), "public", "json", "Q_bot_constants.json")
        const readFile = fs.readFileSync(filePath, "utf-8")
        const serverConsts = JSON.parse(readFile);
        switch(adminMessage[0]){
            case "PAUSE":
                serverConsts.pauseQLeague = true;
                writeToFile = true
                response = "Boxscore Bot has been paused."
            break;
            case "RESUME":
                serverConsts.pauseQLeague = false;
                writeToFile = true
                response = "Boxscore Bot resumed.";
            break;
            case "GET":
                switch(adminMessage[1]){
                    case "SETTINGS":
                        writeToFile = false;
                        const settings = {
                            adminListeningChannel: serverConsts["adminsListeningChannel"],
                            saveStatesListeningChannel: serverConsts["saveStatesListeningChannel"],
                            boxscoreOutputChannel: serverConsts["boxscoreOutputChannel"],
                            saveStatePattern: serverConsts["saveStatePattern"],
                            pauseQLeague: serverConsts["pauseQLeague"],
                            allowDuplicates: serverConsts["allowDuplicates"],
                            writeToUniqueIdsFile: serverConsts["writeToUniqueIdsFile"],
                            writeToGoogleSheets: serverConsts["writeToGoogleSheets"],
                            sendBoxscore: serverConsts["sendBoxscore"],
                        };                       
                        response = JSON.stringify(settings, null, 2)
                    break;
                    case "COMMANDS":
                        // Remove 'GET', 'SET' from list to be displayed in discord.
                        serverConsts.adminCommands.splice(2,2)
                        serverConsts.adminCommands[0] = "PAUSE - pauses BSB. Game state uploads are ignored. Admin commands still work."
                        serverConsts.adminCommands[1] = "RESUME - resumes BSB. Game state uploads will be processed"
                        
                        writeToFile = false
                        response = `${JSON.stringify(serverConsts.adminCommands, null, 2)}`
                    break;
                    case "SEASON":
                        if(adminMessage[2] === "NUMBER"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.seasonNum, null, 2)
                        }
                        break;
                    case "TEAMCODES":
                            writeToFile = false
                            response = JSON.stringify(serverConsts.teamCodes, null, 2)
                    break;
                    default:
                        response = "Keyword not found."
                }               
            break;
            case "SET":
                switch(adminMessage[1]){
                    case "DUPLICATES":
                        if(adminMessage[2] === "TRUE"){
                            serverConsts.allowDuplicates = true
                            serverConsts.writeToUniqueIdsFile = false
                        } else if(adminMessage[2] === "FALSE") {
                            serverConsts.allowDuplicates = false
                            serverConsts.writeToUniqueIdsFile = true
                        } else {
                            writeToFile = false;
                            response = "Setting needs to be either 'TRUE' or 'FALSE'."
                        }
                        writeToFile = true
                        response = `Allowing duplicates is ${adminMessage[2]}.\nWrite to unique file list set to ${adminMessage[2] === "TRUE"? "false":"true"}.`
                    break;
                    case "SHEETS":
                        if(adminMessage[2] === "TRUE"){
                            serverConsts.writeToGoogleSheets = true
                        } else if(adminMessage[2] === "FALSE") {
                            serverConsts.writeToGoogleSheets = false
                        }
                        writeToFile = true
                        response = `Writing to google sheets has been ${adminMessage[2] === "TRUE"? "enabled":"disabled"}.`
                    break;
                    case "BOXSCORE":
                        if (adminMessage[2] === "TRUE") {
                            serverConsts.sendBoxscore = true;
                            writeToFile = true;
                            response = `Creating boxscore image has been enabled.`;
                        } else if (adminMessage[2] === "FALSE") {
                            serverConsts.sendBoxscore = false;
                            writeToFile = true;
                            response = `Creating boxscore image has been disabled.`;
                        } else if (adminMessage[2] === "CHANNEL") {
                            if (adminMessage[3]) {
                                const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                                if (searchForChannel) {
                                    serverConsts.boxscoreOutputChannel = adminMessage[3];
                                    writeToFile = true;
                                    response = `Boxscores listening channel has been edited to ${adminMessage[3]}`;
                                } else {
                                    writeToFile = false;
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`;
                                }
                            } else {
                                writeToFile = false;
                                response = `A name for the new output channel needs to be provided.`;
                            }
                        } else {
                            writeToFile = false;
                            response = "Must be either TRUE, FALSE, or CHANNEL.";
                        }
                        break;  
                    case "ADMIN":
                        if(adminMessage[2] === "CHANNEL"){
                            const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                            if(searchForChannel){
                                serverConsts.adminsListeningChannel = adminMessage[3];
                                writeToFile = true;
                                response = `Admin listening channel has been edited to ${adminMessage[3]}`
                            } else {
                                writeToFile = false;
                                if(adminMessage[3]){
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                                } else {
                                    writeToFile = false;
                                    response = `A new channel name needs to be provided.`
                                }
                            }
                        } else {
                            writeToFile = false;
                            response = `The command for setting a new admins input channel is \`SET ADMIN INPUT CHANNEL new-admin-input-channel-name\`.`
                        }
                    break;
                    case "STATE":
                        if(adminMessage[2] === "CHANNEL" && adminMessage[3]){
                            const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                            if(searchForChannel){
                                serverConsts.saveStatesListeningChannel = adminMessage[3];
                                writeToFile = true;
                                response = `Listening channel has been edited to ${adminMessage[3]}`
                            } else {
                                writeToFile = false;
                                response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                            }
                        } else {
                            writeToFile = false
                            response = `A name for new channel needs to be provided.`
                        }
                    break;
                    case "SAVE":
                        if(adminMessage[2] === "STATE" && adminMessage[3]){
                            if(adminMessage[3].length > 5){
                                writeToFile = false
                                response = `Can't be more than 5 characters. Should be something like W13 or WP13 (playoffs).`
                            } else {
                                serverConsts.saveStatePattern = `^${adminMessage[3]}.*\\.state\\d{1,3}$`
                                writeToFile = true
                                response = `The new save state to be accepted is \`${serverConsts.saveStatePattern}\``
                            }
                        } else {
                            writeToFile = false
                            response = "To edit the save state name the command is `SAVE STATE` followed by league and season number."
                        }
                    break;
                    case "SEASON":
                        if(adminMessage[2]){
                            const numberCheckPattern = /^\d{1,2}$/
                            const isNumber = numberCheckPattern.test(adminMessage[2]);
                            if(isNumber){
                                serverConsts.seasonNum = adminMessage[2];
                                writeToFile = true
                                response = `Season number has been updated to ${adminMessage[2]}`
                            }else{
                                writeToFile = false
                                response = "Only digits are accepted"
                            }
                        }
                    break;
                    case "TEAMCODES":
                        if(adminMessage[2]){
                            const listPattern = /^([A-Z]{3},){1,35}[A-Z]{3}$/
                            const isListValid = listPattern.test(adminMessage[2]);
                            if(isListValid){
                                const teamsList = adminMessage[2].split(",")
                                serverConsts.teamCodes = teamsList
                                writeToFile = true;
                                response = `Team codes list has been updated. Run "GET TEAMCODES" to veryify.`
                            } else {
                                writeToFile = false
                                response = `Double check the list of teams is correctly formatted. It has to be 1-35 in length, uppercase letters, and comma seperated with no comma at the beginning or end.`
                            }
                        } else {
                            writeToFile = false
                            response = `A comma seperated list of team abbreviations needs to be provided after the keyword 'TEAMCODES'.\nEach team code needs to be 3 uppercase letters.\nDo not start or end the list with a comma.\nEx. SET TEAMCODES AHC,AUT,BAY`
                        }
                    break;
                    case "ROM":
                        if(adminMessage[2] === "CSV"){
                            let leagueName;
                            let seasonNumber;
                            // league name entry
                            if(adminMessage[3]){
                                const leagueNamePattern = /^[A-Z]$/;
                                const isValidLeagueName = leagueNamePattern.test(adminMessage[3]);
                                if(!isValidLeagueName){
                                    writeToFile = false
                                    response = `The league name should be one uppercase letter`
                                }
                            // season number entry
                            if(adminMessage[4]){
                                const seasonNumberPattern = /^[0-9]{1,2}$/;
                                const isValidSeasonNumber = seasonNumberPattern.test(adminMessage[4]);
                                if(!isValidSeasonNumber){
                                    writeToFile = false
                                    response = `Season number needs to be 1 or 2 digits in length`
                                }
                            }

                            leagueName = adminMessage[3]
                            seasonNumber = adminMessage[4]

                            // check a file was even attached
                            const { url, fileName } = csvFile
                            if(!url || !fileName){
                                writeToFile = false;
                                response = `A file needs to be attached with this command.`
                            } else {
                                const csvFilePath = path.join(process.cwd(), "lib", "game-state-parsing", "read-csv", "csv", leagueName, seasonNumber)                            
                                const getCsvFile = await fetch(url);
                                const csvFileContents = await getCsvFile.text();
    
                                try {
                                    fs.mkdirSync(csvFilePath, {recursive: true})
                                } catch (error) {
                                    writeToFile = false;
                                    response = `Failed to create the directory.`
                                    break;
                                }
    
                                try {                                
                                    const csvFileFullPath = path.join(csvFilePath, fileName)
                                    fs.writeFileSync(csvFileFullPath, csvFileContents, {encoding: "utf-8"})                          
                                } catch (error) {
                                    writeToFile = false;
                                    response = `Failed to upload ${fileName}.`
                                    break;
                                }
    
                                writeToCsvFile = true;
                                response = `${fileName} has been uploaded.`
                            }
                            } else {
                                writeToFile = false
                                response = `A league name and season number are required`
                            }
                        }
                    break;
                }
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
        } else if(writeToCsvFile){
            await channel.send(response)
        } else {
            await channel.send(response)
        }
    }
}

export default parseAdminMessage;