import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";

// W league constants
const filePath = path.join(process.cwd(), "public", "json", "bot_constants.json")
const readFile = fs.readFileSync(filePath, "utf-8")

// Q league constants
const qFilePath = path.join(process.cwd(), "public", "json", "q_bot_constants.json")
const readQFile = fs.readFileSync(qFilePath, "utf-8")

// Pure league constants
const pureFilePath = path.join(process.cwd(), "public", "json", "pure_bot_constants.json")
const readPureFile = fs.readFileSync(pureFilePath, "utf-8")

// parse W league
const watched_bot_consts = JSON.parse(readFile)
// parse Q league
const q_watched_bot_consts = JSON.parse(readQFile)
// parse Pure league
const pure_watched_bot_consts = JSON.parse(readPureFile)

// assign W league consts
const bot_consts = {
    token : `${process.env.token}`, // token or dev-token
    uniqueIdsFileName: `${process.env.uniqueIdsFileName}`, // the test for duplicates/invalid states
    server: `${process.env.server}`,
    ...watched_bot_consts,
};

// assign Q league consts
const q_bot_consts = {
    token : `${process.env.token}`, // token or dev-token
    q_uniqueIdsFileName: `${process.env.qUniqueIdsFileName}`, // the test for duplicates/invalid states
    q_server: `${process.env.qServer}`,
    ...q_watched_bot_consts,
};

// assign Pure league consts
const pure_consts = {
    token : `${process.env.token}`, // token or dev-token
    pure_server: `${process.env.pureServer}`,
    p_uniqueIdsFileName: `${process.env.pUniqueIdsFileName}`, // the test for duplicates/invalid states
    ...pure_watched_bot_consts,
};

// W league event emitter
const bot_consts_update_emitter = new EventEmitter();
// Q league event emitter
const q_bot_consts_update_emitter = new EventEmitter();
// P league event emitter
const p_bot_consts_update_emitter = new EventEmitter();

// watch W league constants file
fs.watchFile(filePath, async (curr, prev) => {
    if(curr.mtime !== prev.mtime){
        const readInConsts = fs.readFileSync(filePath, "utf-8");
        const updatedConsts = JSON.parse(readInConsts)
        for(const [key, value] of Object.entries(updatedConsts)){
            bot_consts[key] = value
        }
        bot_consts_update_emitter.emit("bot_consts_update_emitter", bot_consts)
    }
})

// watch Q league constants file
fs.watchFile(qFilePath, async (curr, prev) => {
    if(curr.mtime !== prev.mtime){
        const readInConsts = fs.readFileSync(qFilePath, "utf-8");
        const updatedConsts = JSON.parse(readInConsts)
        for(const [key, value] of Object.entries(updatedConsts)){
            q_bot_consts[key] = value
        }
        q_bot_consts_update_emitter.emit("q_bot_consts_update_emitter", q_bot_consts)
    }
})

// watch Pure league constants file
fs.watchFile(pureFilePath, async (curr, prev) => {
    if(curr.mtime !== prev.mtime){
        const readInConsts = fs.readFileSync(pureFilePath, "utf-8");
        const updatedConsts = JSON.parse(readInConsts)
        for(const [key, value] of Object.entries(updatedConsts)){
            pure_consts[key] = value
        }
        p_bot_consts_update_emitter.emit("p_bot_consts_update_emitter", pure_consts)
    }
})

export { 
        bot_consts,
        q_bot_consts,
        pure_consts,
        bot_consts_update_emitter,
        q_bot_consts_update_emitter,
        p_bot_consts_update_emitter
         }