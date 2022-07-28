import { PrismaClient } from "@prisma/client"
import { createReadStream, createWriteStream } from "fs"
import { status } from "minecraft-server-util"
import StreamArray from "stream-json/streamers/StreamArray"
const streamArray = new StreamArray()
const ips: string[] = []
import 'dotenv/config'
import { readFile } from "fs/promises"
const prisma = new PrismaClient()
const pipeline = createReadStream("./scan.json").pipe(StreamArray.withParser())

const already = (await readFile("done.txt")).toString().split("\n")
const alreadyWriter = await createWriteStream("done.txt", {flags: "a"})
pipeline.on("data", data => {
    if (!already.includes(data.value.ip)) {
        ips.push(data.value.ip)
    }
})

pipeline.on("end", async() => {
    
    console.log(`IPS length ${ips.length}`)
    console.log(`ALREADY length ${already.length}`)
    
    
    
    console.log("Finished ip loading")
    setInterval(async () => {
        let some: undefined | string[] = ips.splice(0, 500)
        some.forEach(async (ip, index) => {
            alreadyWriter.write(ip + "\n")
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
    
})

