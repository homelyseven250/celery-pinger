import { PrismaClient } from "@prisma/client"
import { createReadStream } from "fs"
import { status } from "minecraft-server-util"
import StreamArray from "stream-json/streamers/StreamArray"
const streamArray = new StreamArray()
const ips: string[] = []

const prisma = new PrismaClient()
const pipeline = createReadStream("./scan.json").pipe(StreamArray.withParser())

pipeline.on("data", data => {
    ips.push(data.value.ip)
})
console.log("Finished ip loading")
setInterval(async () => {
    const some = ips.splice(0, 500)
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
}, 1000)