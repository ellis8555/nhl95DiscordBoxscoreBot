import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { fileURLToPath } from "node:url";

// Convert ES module URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// allowed servers
//prevents BSB from being brought into any other servers via only allowed server id's
// pure server . pure testing server, Ellis' test server, Q Mock server
const allowedGuilds = ['1196260352061620275', '1355293670051545289' , '1322696365305757746', '1331313899135438848']

// Pure league constants
const pureFilePath = path.join(__dirname, "..", "..", "public", "json", "pure_bot_constants.json");
const readPureFile = fs.readFileSync(pureFilePath, "utf-8");

// parse Pure league
const pure_watched_bot_consts = JSON.parse(readPureFile);

// assign Pure league consts
const pure_consts = {
    token: process.env.token,
    pure_server: process.env.pureServer,
    p_uniqueIdsFileName: process.env.pUniqueIdsFileName,
    ...pure_watched_bot_consts,
};

const p_bot_consts_update_emitter = new EventEmitter()

// watch Pure league constants file
fs.watchFile(pureFilePath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        const updatedConsts = JSON.parse(fs.readFileSync(pureFilePath, "utf-8"));
        Object.assign(pure_consts, updatedConsts);
        p_bot_consts_update_emitter.emit("p_bot_consts_update_emitter", pure_consts);
    }
});

export { 
    allowedGuilds,
    pure_consts,
    p_bot_consts_update_emitter,
};
