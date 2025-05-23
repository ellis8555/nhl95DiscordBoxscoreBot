import fs from "node:fs";
import path from "node:path";
import editLeagueSettings from "../google-sheets/editLeagueSettings.js";

async function parseAdminMessage(adminsListeningChannelId, {server, adminMessage, client, csvFile, sheets}){
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
                        // extract the rom name in order not to display the actual regular expression
                        const saveStateParts = serverConsts["saveStatePattern"].split(".")
                        const saveStateRomName = saveStateParts[0].slice(1)
                        // display team logos for disbanded or paused teams
                        const excludedCoachesIcons = []
                        serverConsts["excludeCoaches"].forEach(coach => {
                            const getCoach = serverConsts["coaches"].find(user => user.team === coach)
                            excludedCoachesIcons.push(`<:${getCoach.emojiName}:${getCoach.emojiId}>`)
                        })
                        const settings = {
                            "Admin listening channel": serverConsts["adminsListeningChannel"],
                            "Save states listening channel": serverConsts["saveStatesListeningChannel"],
                            "Boxscore display channel": serverConsts["boxscoreOutputChannel"],
                            "Current ROM name": saveStateRomName,
                            "Pause league": serverConsts["pauseWLeague"],
                            "Allow duplicates": serverConsts["allowDuplicates"],
                            "Write to unique id's file": serverConsts["writeToUniqueIdsFile"],
                            "Write to google sheets": serverConsts["writeToGoogleSheets"],
                            "Disbanded or paused teams": excludedCoachesIcons,
                        };                       
                        writeToFile = false;
                        response = JSON.stringify(settings, null, 2)
                    break;
                    case "COMMANDS":
                        // Remove 'GET', 'SET', 'HELP' from list to be displayed in discord.
                        serverConsts.adminCommands.splice(2,3)
                        serverConsts.adminCommands[0] = "PAUSE - pauses BSB. Game state uploads are ignored. Admin commands still work."
                        serverConsts.adminCommands[1] = "RESUME - resumes BSB. Game state uploads will be processed"
                        
                        writeToFile = false
                        response = `${JSON.stringify(serverConsts.adminCommands, null, 2)}`
                    break;
                    case "SEASON":
                        if(adminMessage[2] === "NUMBER"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.seasonNum, null, 2)
                            break;
                        } else {
                            writeToFile = false
                            response = `Add \`NUMBER\` to the command to get the season number`
                            break;
                        }
                        break;
                    case "TEAMCODES":
                        if(serverConsts.teamCodes){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.teamCodes, null, 2)
                        } else {
                            writeToFile = false
                            response = `teamCodes needs to be set as it is currently blank.`
                        }
                    break;
                    case "COACHES":
                        let coachList = ""
                        serverConsts.coaches.sort((a, b) => a.user.localeCompare(b.user)).forEach(coach => coachList += `${coach.user} - <:${coach.emojiName}:${coach.emojiId}>\n`)
                        coachList += `\nCoach count = ${serverConsts.coaches.length}`
                        writeToFile = false
                        response = coachList
                    break;
                    default:
                        response = "Keyword not found."
                } 
                if(!adminMessage[1]){
                    writeToFile = false
                    response = `GET needs to be followed up with another keyword`
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
                            break;
                        }
                        writeToFile = true
                        response = `Allowing duplicates is ${adminMessage[2]}.\nWrite to unique file list set to ${adminMessage[2] === "TRUE"? "false":"true"}.`
                    break;
                    case "SHEETS":
                        if(adminMessage[2] === "TRUE"){
                            serverConsts.writeToGoogleSheets = true
                            writeToFile = true
                            response = `Writing to google sheets has been ${adminMessage[2] === "TRUE"? "enabled":"disabled"}.`
                            break;
                        } else if(adminMessage[2] === "FALSE") {
                            serverConsts.writeToGoogleSheets = false
                            writeToFile = true
                            response = `Writing to google sheets has been ${adminMessage[2] === "TRUE"? "enabled":"disabled"}.`
                            break;
                        } else {
                            writeToFile = false
                            response = `either \`TRUE\` or \`FALSE\` needs to follow sheets command`
                            break;
                        }
                    break;
                    case "BOXSCORE":
                        if (adminMessage[2] === "TRUE") {
                            serverConsts.sendBoxscore = true;
                            writeToFile = true;
                            response = `Creating boxscore image has been enabled.`;
                            break;
                        } else if (adminMessage[2] === "FALSE") {
                            serverConsts.sendBoxscore = false;
                            writeToFile = true;
                            response = `Creating boxscore image has been disabled.`;
                            break;
                        } else if (adminMessage[2] === "CHANNEL") {
                            if (adminMessage[3]) {
                                const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                                if (searchForChannel) {
                                    serverConsts.boxscoreOutputChannel = adminMessage[3];
                                    writeToFile = true;
                                    response = `Boxscores listening channel has been edited to ${adminMessage[3]}`;
                                    break;
                                } else {
                                    writeToFile = false;
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`;
                                    break;
                                }
                            } else {
                                writeToFile = false;
                                response = `A name for the new output channel needs to be provided.`;
                                break;
                            }
                        } else {
                            writeToFile = false;
                            response = "Must be either TRUE, FALSE, or CHANNEL.";
                            break;
                        }
                        break;  
                    case "ADMIN":
                        if(adminMessage[2] === "CHANNEL"){
                            const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                            if(searchForChannel){
                                serverConsts.adminsListeningChannel = adminMessage[3];
                                writeToFile = true;
                                response = `Admin listening channel has been edited to ${adminMessage[3]}`
                                break;
                            } else {
                                writeToFile = false;
                                if(adminMessage[3]){
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                                    break;
                                } else {
                                    writeToFile = false;
                                    response = `A new channel name needs to be provided.`
                                    break;
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
                                break;
                            } else {
                                writeToFile = false;
                                response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                                break;
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
                                break;
                            } else {
                                serverConsts.saveStatePattern = `^${adminMessage[3]}.*\\.state\\d{1,3}$`
                                writeToFile = true
                                response = `The new save state to be accepted is \`${serverConsts.saveStatePattern}\``
                                break;
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
                                break;
                            }else{
                                writeToFile = false
                                response = "Only digits are accepted"
                                break;
                            }
                        } else {
                            writeToFile = false
                            response = `a 2 digit number needs to follow season if trying to set a new season number`
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
                                break;
                            } else {
                                writeToFile = false
                                response = `Double check the list of teams is correctly formatted. It has to be 1-35 in length, uppercase letters, and comma seperated with no comma at the beginning or end.`
                                break;
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
                                    break;
                                }
                            // season number entry
                            if(adminMessage[4]){
                                const seasonNumberPattern = /^[0-9]{1,2}$/;
                                const isValidSeasonNumber = seasonNumberPattern.test(adminMessage[4]);
                                if(!isValidSeasonNumber){
                                    writeToFile = false
                                    response = `Season number needs to be 1 or 2 digits in length`
                                    break;
                                }
                                if(adminMessage[4] !== serverConsts.seasonNum){
                                    writeToFile = false
                                    response = `The season number entered needs to match the current season\nCurrent season: ${serverConsts.seasonNum}`
                                    break;
                                }
                            }

                            leagueName = adminMessage[3]
                            seasonNumber = adminMessage[4]

                            // check a file was even attached
                            const { url, fileName } = csvFile
                            if(!url || !fileName){
                                writeToFile = false;
                                response = `A file needs to be attached with this command.`
                                break;
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
                                break;
                            }
                            } else {
                                writeToFile = false
                                response = `A league name and season number are required`
                                break;
                            }
                        } else {
                            writeToFile = false
                            response = `SET ROM needs to followed by \`CSV\`, \`<league name>\`, \`<season number>\``
                        }
                    break;
                    default:
                        writeToFile = false
                        response = `There's an issue with \`${adminMessage}\` command. Could be mistyped or the script needs to be checked.`
                        break;
                    }
                break;
            case "HELP":
                        // no help commands require writing to file
                        if(adminMessage[1] === "SET"){
                            switch(adminMessage[2]){
                                case "CHANNELS":
                                    writeToFile = false;
                                    response = `To set admin/boxscores/state channels\n\`SET ADMIN CHANNEL "new-admin-channel"\`\nBe sure to include hyphens. No spaces in the channel name will work.`
                                break;
                                case "SAVE":
                                    writeToFile = false;
                                    response = `To edit the name of the saved state that will be accepted write the following\n\`SET SAVE STATE W12\`\nW12 in the example will prepend \`W12\` to the beginning of the states name which ends in \`.state\` and numbers. `
                                break;
                                case "TEAM":
                                    writeToFile = false;
                                    response = `To edit the codes to match that in the .py file for proper game processing enter the following\n\`SET TEAM CODES AHC,BAY,HAM,HIG\`\nCopy the teams codes from .py file\nUse chatGPT to remove spaces and quotes from the list.\nEnter exactly as shown above. 3 capital letters followed by a comma and zero spaces.`
                                break;
                                case "ROM":
                                    writeToFile = false;
                                    response = `To add the 3 csv files the command needs to be used WITH a single csv attachment.\nOnly one file at a time.\n\`1. Drag the csv file into discord\`\n2. Write the following comment for the attachment,\n\`SET ROM CSV q 95\`\nThe league name needs to be lowercase.\nThe season number can only be 2 digits long.`
                                break;
                                default:
                                    writeToFile = false
                                    response = `Keyword is not recognized.`
                                    break;
                            }
                        } else {
                            writeToFile = false;
                            response = `Use \`GET COMMANDS\` to see what options there are for HELP command.`
                            break;
                        }
                        if(!adminMessage[1] || !adminMessage[2]){
                            writeToFile = false;
                            response = `HELP command needs to be followed up with \`SET\` followed by another keyword.\n Use \`GET COMMANDS\` to see.`
                            break;
                        }
                    break;
            case "UPDATE":
                if(adminMessage[1] === 'SETTINGS'){
                    writeToFile = false;
                    response = await editLeagueSettings({sheets})
                } else {
                    writeToFile = false;
                    response = `UPDATE ${adminMessage[1]} not recognized\n UPDATE SETTINGS is update command`
                }
                break;
            default:
            writeToFile = false
            response = `Keyword or phrase \`${adminMessage}\` not recognized.`
            break;
        }

        if(response){
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
        } else {
            await channel.send(`Response needs to be looked at in the script on the entered command.\n\`${adminMessage}\``)
        }
    }

    // Q league server
    if(server === q_server){
        const filePath = path.join(process.cwd(), "public", "json", "q_bot_constants.json")
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
                        // Remove 'GET', 'SET', 'HELP' from list to be displayed in discord.
                        serverConsts.adminCommands.splice(2,3)
                        serverConsts.adminCommands[0] = "PAUSE - pauses BSB. Game state uploads are ignored. Admin commands still work."
                        serverConsts.adminCommands[1] = "RESUME - resumes BSB. Game state uploads will be processed"
                        
                        writeToFile = false
                        response = `${JSON.stringify(serverConsts.adminCommands, null, 2)}`
                    break;
                    case "SEASON":
                        if(adminMessage[2] === "NUMBER"){
                            writeToFile = false
                            response = JSON.stringify(serverConsts.q_seasonNum, null, 2)
                            break;
                        } else {
                            writeToFile = false
                            response = `Add \`NUMBER\` to the command to get the season number`
                            break;
                        }
                        break;
                    case "TEAMCODES":
                            if(serverConsts.teamCodes){
                                writeToFile = false
                                response = JSON.stringify(serverConsts.teamCodes, null, 2)
                                break;
                            } else {
                                writeToFile = false
                                response = `teamCodes needs to be set as it is currently blank.`
                                break;
                            }
                    break;
                    default:
                        response = "Keyword not found."
                        break;
                }
                if(!adminMessage[1]){
                    writeToFile = false
                    response = `GET needs to be followed up with another keyword`
                    break;
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
                            break;
                        }
                        writeToFile = true
                        response = `Allowing duplicates is ${adminMessage[2]}.\nWrite to unique file list set to ${adminMessage[2] === "TRUE"? "false":"true"}.`
                    break;
                    case "SHEETS":
                        if(adminMessage[2] === "TRUE"){
                            serverConsts.writeToGoogleSheets = true
                            writeToFile = true
                            response = `Writing to google sheets has been ${adminMessage[2] === "TRUE"? "enabled":"disabled"}.`
                            break;
                        } else if(adminMessage[2] === "FALSE") {
                            serverConsts.writeToGoogleSheets = false
                            writeToFile = true
                            response = `Writing to google sheets has been ${adminMessage[2] === "TRUE"? "enabled":"disabled"}.`
                            break;
                        } else {
                            writeToFile = false
                            response = `either \`TRUE\` or \`FALSE\` needs to follow sheets command`
                            break;
                        }
                    break;
                    case "BOXSCORE":
                        if (adminMessage[2] === "TRUE") {
                            serverConsts.sendBoxscore = true;
                            writeToFile = true;
                            response = `Creating boxscore image has been enabled.`;
                            break;
                        } else if (adminMessage[2] === "FALSE") {
                            serverConsts.sendBoxscore = false;
                            writeToFile = true;
                            response = `Creating boxscore image has been disabled.`;
                            break;
                        } else if (adminMessage[2] === "CHANNEL") {
                            if (adminMessage[3]) {
                                const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                                if (searchForChannel) {
                                    serverConsts.boxscoreOutputChannel = adminMessage[3];
                                    writeToFile = true;
                                    response = `Boxscores listening channel has been edited to ${adminMessage[3]}`;
                                    break;
                                } else {
                                    writeToFile = false;
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`;
                                    break;
                                }
                            } else {
                                writeToFile = false;
                                response = `A name for the new output channel needs to be provided.`;
                                break;
                            }
                        } else {
                            writeToFile = false;
                            response = "Must be either TRUE, FALSE, or CHANNEL.";
                            break;
                        }
                        break;  
                    case "ADMIN":
                        if(adminMessage[2] === "CHANNEL"){
                            const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                            if(searchForChannel){
                                serverConsts.adminsListeningChannel = adminMessage[3];
                                writeToFile = true;
                                response = `Admin listening channel has been edited to ${adminMessage[3]}`
                                break;
                            } else {
                                writeToFile = false;
                                if(adminMessage[3]){
                                    response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                                    break;
                                } else {
                                    writeToFile = false;
                                    response = `A new channel name needs to be provided.`
                                    break;
                                }
                            }
                        } else {
                            writeToFile = false;
                            response = `The command for setting a new admins input channel is \`SET ADMIN INPUT CHANNEL new-admin-input-channel-name\`.`
                            break;
                        }
                    break;
                    case "STATE":
                        if(adminMessage[2] === "CHANNEL" && adminMessage[3]){
                            const searchForChannel = client.channels.cache.find(c => c.name === adminMessage[3]);
                            if(searchForChannel){
                                serverConsts.saveStatesListeningChannel = adminMessage[3];
                                writeToFile = true;
                                response = `Listening channel has been edited to ${adminMessage[3]}`
                                break;
                            } else {
                                writeToFile = false;
                                response = `\`${adminMessage[3]}\` can't be found in this server.\nCheck spelling or create that channel first.`
                                break;
                            }
                        } else {
                            writeToFile = false
                            response = `A name for new channel needs to be provided.`
                            break;
                        }
                    break;
                    case "SAVE":
                        if(adminMessage[2] === "STATE" && adminMessage[3]){
                            if(adminMessage[3].length > 5){
                                writeToFile = false
                                response = `Can't be more than 5 characters. Should be something like W13 or WP13 (playoffs).`
                                break;
                            } else {
                                serverConsts.saveStatePattern = `^${adminMessage[3]}.*\\.state\\d{1,3}$`
                                writeToFile = true
                                response = `The new save state to be accepted is \`${serverConsts.saveStatePattern}\``
                                break;
                            }
                        } else {
                            writeToFile = false
                            response = "To edit the save state name the command is `SAVE STATE` followed by league and season number."
                            break;
                        }
                    break;
                    case "SEASON":
                        if(adminMessage[2]){
                            const numberCheckPattern = /^\d{1,2}$/
                            const isNumber = numberCheckPattern.test(adminMessage[2]);
                            if(isNumber){
                                serverConsts.q_seasonNum = adminMessage[2];
                                writeToFile = true
                                response = `Season number has been updated to ${adminMessage[2]}`
                                break;
                            }else{
                                writeToFile = false
                                response = "Only digits are accepted"
                                break;
                            }
                        } else {
                            writeToFile = false
                            response = `a 2 digit number needs to follow season if trying to set a new season number`
                            break;
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
                                break;
                            } else {
                                writeToFile = false
                                response = `Double check the list of teams is correctly formatted. It has to be 1-35 in length, uppercase letters, and comma seperated with no comma at the beginning or end.`
                                break;
                            }
                        } else {
                            writeToFile = false
                            response = `A comma seperated list of team abbreviations needs to be provided after the keyword 'TEAMCODES'.\nEach team code needs to be 3 uppercase letters.\nDo not start or end the list with a comma.\nEx. SET TEAMCODES AHC,AUT,BAY`
                            break;
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
                                    break;
                                }
                            // season number entry
                            if(adminMessage[4]){
                                const seasonNumberPattern = /^[0-9]{1,2}$/;
                                const isValidSeasonNumber = seasonNumberPattern.test(adminMessage[4]);
                                if(!isValidSeasonNumber){
                                    writeToFile = false
                                    response = `Season number needs to be 1 or 2 digits in length`
                                    break;
                                }
                                if(adminMessage[4] !== serverConsts.q_seasonNum){
                                    writeToFile = false
                                    response = `The season number entered needs to match the current season\nCurrent season: ${serverConsts.q_seasonNum}`
                                    break;
                                }
                            }

                            leagueName = adminMessage[3]
                            seasonNumber = adminMessage[4]

                            // check a file was even attached
                            const { url, fileName } = csvFile
                            if(!url || !fileName){
                                writeToFile = false;
                                response = `A file needs to be attached with this command.`
                                break;
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
                                break;
                            }
                            } else {
                                writeToFile = false
                                response = `A league name and season number are required`
                                break;
                            }
                        } else {
                            writeToFile = false
                            response = `SET ROM needs to followed by \`CSV\`, \`<league name>\`, \`<season number>\``
                            break;
                        }
                    break;
                    default:
                        writeToFile = false
                        response = `There's an issue with \`${adminMessage}\` command. Could be mistyped or the script needs to be checked.`
                        break;
                }
                    break;
            case "HELP":
                    // no help commands require writing to file
                    if(adminMessage[1] === "SET"){
                        switch(adminMessage[2]){
                            case "CHANNELS":
                                writeToFile = false;
                                response = `To set admin/boxscores/state channels\n\`SET ADMIN CHANNEL "new-admin-channel"\`\nBe sure to include hyphens. No spaces in the channel name will work.`
                            break;
                            case "SAVE":
                                writeToFile = false;
                                response = `To edit the name of the saved state that will be accepted write the following\n\`SET SAVE STATE W12\`\nW12 in the example will prepend \`W12\` to the beginning of the states name which ends in \`.state\` and numbers. `
                            break;
                            case "TEAM":
                                writeToFile = false;
                                response = `To edit the codes to match that in the .py file for proper game processing enter the following\n\`SET TEAM CODES AHC,BAY,HAM,HIG\`\nCopy the teams codes from .py file\nUse chatGPT to remove spaces and quotes from the list.\nEnter exactly as shown above. 3 capital letters followed by a comma and zero spaces.`
                            break;
                            case "ROM":
                                writeToFile = false;
                                response = `To add the 3 csv files the command needs to be used WITH a single csv attachment.\nOnly one file at a time.\n\`1. Drag the csv file into discord\`\n2. Write the following comment for the attachment,\n\`SET ROM CSV q 95\`\nThe league name needs to be lowercase.\nThe season number can only be 2 digits long.`
                            break;
                            default:
                                writeToFile = false
                                response = `Keyword is not recognized.`
                                break;
                        }
                    } else {
                        writeToFile = false;
                        response = `Use \`GET COMMANDS\` to see what options there are for HELP command.`
                        break;
                    }
                    if(!adminMessage[1] || !adminMessage[2]){
                        writeToFile = false;
                        response = `HELP command needs to be followed up with \`SET\` followed by another keyword.\n Use \`GET COMMANDS\` to see.`
                        break;
                    }
                break;
            default:
                writeToFile = false
                response = `Keyword or phrase \`${adminMessage}\` not recognized.`
                break;
        }

        if(response){
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
        } else {
            await channel.send(`Response needs to be looked at in the script on the entered command.\n\`${adminMessage}\``)
        }
    }
}

export default parseAdminMessage;