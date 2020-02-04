const WebSocket = require("ws")
const rxjs = require("rxjs")

const PORT = 8081
const wss = new WebSocket.Server({ port: PORT })

const interval = rxjs.interval(1000)

console.log("createSocket on port " + PORT)
wss.on("connection", ws => {
    ws.on("message", message => {
        console.log(`Received message => ${message}`)
    })
    const id = interval.subscribe(value => {
        console.log(`Sending ${value}`)
        ws.send("second " + value)
    })

    ws.on("close", () => {
        console.log("Dissconected")
        id.unsubscribe()
    })
})
