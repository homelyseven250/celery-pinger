import { PrismaClient } from "@prisma/client"
import { createReadStream, createWriteStream } from "fs"
import { status } from "minecraft-server-util"
import StreamArray from "stream-json/streamers/StreamArray"
import 'dotenv/config'
import { readFile } from "fs/promises"

let ips: string[] = []

const prisma = new PrismaClient()
const pipeline = createReadStream("./scan.json").pipe(StreamArray.withParser())

const already = new Set((await readFile("done.txt")).toString().split("\n"))
console.log(`ALREADY length ${already.size}`)
const alreadyWriter = createWriteStream("done.txt", { flags: "a" })

pipeline.on("data", async (data) => {
    if (!already.has(data.value.ip)) {
        const ip = data.value.ip
        // console.log(ip)
        try {
            const res = await status(ip)
            if (res.version.protocol != undefined) {
                console.log(ip)
            }
            await prisma.result.create({
                data: {
                    ip,
                    software: res.version.name,
                    protocol: res.version.protocol,
                    onlinePlayers: res.players.online,
                    maxPlayers: res.players.max,
                    samplePlayers: res.players.sample?.map(player => player.id),
                    motd: res.motd.raw,
                    favicon: res.favicon ? Buffer.from(res.favicon) : undefined
                }
            })
            alreadyWriter.write(ip + "\n")
        } catch (e) {
            // console.log(e)
        }
    }
})


