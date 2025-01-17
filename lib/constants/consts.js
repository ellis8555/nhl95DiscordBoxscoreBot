import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";

const filePath = path.join(process.cwd(), "public", "json", "bot_constants.json")
const readFile = fs.readFileSync(filePath, "utf-8")

const watched_bot_consts = JSON.parse(readFile)

const bot_consts = {
    token : `${process.env.token}`, // token or dev-token
    uniqueIdsFileName: `${process.env.uniqueIdsFileName}`, // the test for duplicates/invalid states
    server: `${process.env.server}`,
    ...watched_bot_consts,
};

const bot_consts_update_emitter = new EventEmitter();

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

export { bot_consts, bot_consts_update_emitter }