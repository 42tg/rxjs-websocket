import { Subject } from "rxjs"
import { WebSocketSubject } from "rxjs/webSocket"

export default class CustomSubject<T> extends Subject<T> {
    sockets: WebSocketSubject<T>[] = []

    constructor() {
        super()
    }

    addSocket(socket: WebSocketSubject<T>) {
        socket.subscribe(msg => this.next(msg))

        this.sockets.push(socket)
    }

    send(msg) {
        this.sockets
            .filter(socket => !socket.isStopped)
            .forEach(socket => socket.next(msg))
    }
}
