import CustomSubject from "./CustomSubject"
import { WebSocketSubject } from "rxjs/webSocket"

// tslint:disable-next-line
;(global as any).WebSocket = require("ws")

const createSocket = () => {
    return new WebSocketSubject<string>({
        url: "ws://localhost:8081",
        deserializer: (e: MessageEvent) => e.data,
    })
}

const subject = new CustomSubject<string>()
subject.subscribe(msg => console.log(msg))

const socket = createSocket()
subject.addSocket(socket)

subject.send("test")

setTimeout(() => {
    const socket2 = createSocket()
    subject.addSocket(socket2)
    subject.send("test")

    socket.complete()
    setTimeout(() => {
        socket2.complete()
    }, 5000)
}, 5000)
