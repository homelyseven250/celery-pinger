import { PrismaClient } from "@prisma/client"
import { createReadStream, createWriteStream } from "fs"
import { status } from "minecraft-server-util"
import StreamArray from "stream-json/streamers/StreamArray"
import 'dotenv/config'
import { readFile } from "fs/promises"

const prisma = new PrismaClient()
prisma.$connect()


const already = new Set((await readFile("done.txt")).toString().split("\n"))
console.log(`ALREADY length ${already.size}`)
const alreadyWriter = createWriteStream("done.txt", { flags: "a" })

const pipeline = createReadStream("./scan.json").pipe(StreamArray.withParser())
pipeline.on("data", async (data) => {
    if (!already.has(data.value.ip)) {
        status(data.value.ip).then(async (res) => {
            // await new Promise(r => setTimeout(r, 25));
            if (res.version.protocol != undefined) {
                console.log(data.value.ip)
            }
            try {
                await prisma.result.create({
                    data: {
                        ip: data.value.ip,
                        software: res.version.name,
                        protocol: res.version.protocol,
                        onlinePlayers: res.players.online,
                        maxPlayers: res.players.max,
                        samplePlayers: res.players.sample?.map(player => player.id),
                        motd: res.motd.raw,
                        favicon: res.favicon ? Buffer.from(res.favicon) : undefined
                    }
                })
            }
            catch (e) {
                console.log(e)
            }
            alreadyWriter.write(data.value.ip + "\n")
        }).catch(e => {})
    }
})

process.stdin.resume()