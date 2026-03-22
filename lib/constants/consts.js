import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { fileURLToPath } from "node:url";

// Convert ES module URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// W league constants
const filePath = path.join(__dirname, "..", "..", "public", "json", "bot_constants.json");
const readFile = fs.readFileSync(filePath, "utf-8");
// W league standings
const standingsFilePath = path.join(__dirname, "..", "..", "public", "json", "standings", "w_standings.json");
const readStandingsFile = fs.readFileSync(standingsFilePath, "utf-8")

// Q league constants
const qFilePath = path.join(__dirname, "..", "..", "public", "json", "q_bot_constants.json");
const readQFile = fs.readFileSync(qFilePath, "utf-8");

// Pure league constants
const pureFilePath = path.join(__dirname, "..", "..", "public", "json", "pure_bot_constants.json");
const readPureFile = fs.readFileSync(pureFilePath, "utf-8");

// parse W league
const watched_bot_consts = JSON.parse(readFile);
let watched_W_standings = []
try {
    watched_W_standings = JSON.parse(readStandingsFile)
} catch (error) {
    watched_W_standings = []
}
// parse Q league
const q_watched_bot_consts = JSON.parse(readQFile);
// parse Pure league
const pure_watched_bot_consts = JSON.parse(readPureFile);

// assign W league consts
const bot_consts = {
    token: process.env.token,
    uniqueIdsFileName: process.env.uniqueIdsFileName,
    server: process.env.server,
    ...watched_bot_consts,
};

let w_standings = [
    ...watched_W_standings
]
    

// assign Q league consts
const q_bot_consts = {
    token: process.env.token,
    q_uniqueIdsFileName: process.env.qUniqueIdsFileName,
    q_server: process.env.qServer,
    ...q_watched_bot_consts,
};

// assign Pure league consts
const pure_consts = {
    token: process.env.token,
    pure_server: process.env.pureServer,
    p_uniqueIdsFileName: process.env.pUniqueIdsFileName,
    ...pure_watched_bot_consts,
};

// Event emitters
const bot_consts_update_emitter = new EventEmitter();
const w_standings_update_emitter = new EventEmitter()
const q_bot_consts_update_emitter = new EventEmitter();
const p_bot_consts_update_emitter = new EventEmitter();

// watch W league constants file
fs.watchFile(filePath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        const updatedConsts = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        Object.assign(bot_consts, updatedConsts);
        bot_consts_update_emitter.emit("bot_consts_update_emitter", bot_consts);
    }
});
// watch W league standings file
fs.watchFile(standingsFilePath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        let updatedConsts
        try {
            updatedConsts = JSON.parse(fs.readFileSync(standingsFilePath, "utf-8"));
        } catch (error) {
            updatedConsts = []
        }
        w_standings = updatedConsts
        w_standings_update_emitter.emit("w_standings_update_emitter", JSON.stringify(w_standings));
    }
});

// watch Q league constants file
fs.watchFile(qFilePath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        const updatedConsts = JSON.parse(fs.readFileSync(qFilePath, "utf-8"));
        Object.assign(q_bot_consts, updatedConsts);
        q_bot_consts_update_emitter.emit("q_bot_consts_update_emitter", q_bot_consts);
    }
});

// watch Pure league constants file
fs.watchFile(pureFilePath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        const updatedConsts = JSON.parse(fs.readFileSync(pureFilePath, "utf-8"));
        Object.assign(pure_consts, updatedConsts);
        p_bot_consts_update_emitter.emit("p_bot_consts_update_emitter", pure_consts);
    }
});

export { 
    bot_consts,
    q_bot_consts,
    pure_consts,
    w_standings,
    bot_consts_update_emitter,
    q_bot_consts_update_emitter,
    p_bot_consts_update_emitter,
    w_standings_update_emitter
};
