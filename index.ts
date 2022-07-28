import { PrismaClient } from "@prisma/client"
import { createReadStream } from "fs"
import { status } from "minecraft-server-util"
import StreamArray from "stream-json/streamers/StreamArray"
const streamArray = new StreamArray()
const ips: string[] = []
import 'dotenv/config'
const prisma = new PrismaClient()
const pipeline = createReadStream("./scan.json").pipe(StreamArray.withParser())

const already = (await prisma.result.findMany()).map(result => result.ip)
pipeline.on("data", data => {
    if (!(already.includes(data.value.ip))) {
        ips.push(data.value.ip)
    }
})



console.log("Finished ip loading")
setInterval(async () => {
    let some: undefined | string[] = ips.splice(0, 500)
    some.forEach(async (ip, index) => {
        try {
            const res = await status(ip)
            await prisma.result.create({
                data: {
                    ip,
                    software: res.version.name,
                    protocol: res.version.protocol,
                    onlinePlayers: res.players.online,
                    maxPlayers: res.players.max,
                    samplePlayers: res.players.sample?.map(player => player.id),
                    motd: res.motd.raw
                }
            })
        } catch (e) {
        }
    })
    some = undefined
    global.gc!()
}, 1000)
