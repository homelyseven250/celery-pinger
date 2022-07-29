import { PrismaClient } from "@prisma/client"
import { createReadStream, createWriteStream } from "fs"
import { status } from "minecraft-server-util"
import StreamArray from "stream-json/streamers/StreamArray"
import 'dotenv/config'
import { readFile } from "fs/promises"

const prisma = new PrismaClient()
prisma.$connect()

const ips = new Array()

// const already = new Set((await readFile("done.txt")).toString().split("\n"))
// console.log(`ALREADY length ${already.size}`)
// const alreadyWriter = createWriteStream("done.txt", { flags: "a" })

const pipeline = createReadStream("./scan.json").pipe(StreamArray.withParser())
pipeline.on("data", async (data) => {
    ips.push(data.value.ip)
    // await new Promise(r => setTimeout(r, 25));

})
setInterval(() => {
    Promise.all(ips.splice(0, 500).map(async (ip, index) => {
        status(ip).then((res) => {
            if (res.version.protocol != undefined) {
                console.log(ip)
            }
            prisma.result.create({
                data: {
                    ip: ip,
                    software: res.version.name,
                    protocol: res.version.protocol,
                    onlinePlayers: res.players.online,
                    maxPlayers: res.players.max,
                    samplePlayers: res.players.sample?.map(player => player.id),
                    motd: res.motd.raw,
                    favicon: res.favicon ? Buffer.from(res.favicon) : undefined
                }
            })
        }).catch((e) => void (e))
    }))
    // global.gc!()
}, 50)
process.stdin.resume()