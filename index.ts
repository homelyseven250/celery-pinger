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
const alreadyWriter = createWriteStream("done.txt", {flags: "a"})



const runner = async() => {
    const toPing = ips.filter(ip => !already.has(ip))
    ips = []
    console.log("filtered and beginning pinger")
    setInterval(async () => {
        let some: undefined | string[] = toPing.splice(0, 500)
        some.forEach(async (ip, index) => {
            alreadyWriter.write(ip + "\n")
            try {
                const res = await status(ip)
                console.log(res)
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
                console.log(e)
            }
        })
        some = undefined
        global.gc!()
    }, 1000)
    
}

pipeline.on("data", data => {
    ips.push(data.value.ip)
    if (ips.length > 500000) {
        runner()
    }
})


