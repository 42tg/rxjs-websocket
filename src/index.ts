import { Subject, from, Observable } from "rxjs"
import { map, merge, mergeMap, share, tap, flatMap } from "rxjs/operators"

interface OwnSocket {
    send(message: string)
    readonly $: Observable<string>
    readonly url: string
    close(): void
}

export const webSocket = (url: string, cb): OwnSocket => {
    const onOpen = new Subject()
    const onMessage = new Subject()

    const socket = new WebSocket(url)

    socket.onopen = () => {
        cb(socket)
        onOpen.complete()
    }
    socket.onmessage = e => onMessage.next(e)
    socket.onclose = e => onMessage.complete()
    socket.onerror = e => onMessage.error(e)
    const send = x => socket.send(x)
    const close = () => socket.close()
    const $ = onMessage.pipe(
        // Emit messages
        share(),
        map((x: MessageEvent) => `${url}: ${x.data}`), // DEV ONLY to show which socket emitted
    )

    return {
        send,
        $,
        url,
        close,
    }
}

export default class SocketService {
    socketsMap = new Map<string, OwnSocket>() // Hold all registered sockets

    openSocketSubject = new Subject<OwnSocket>()

    closeSocketSubject = new Subject<string>()

    closeSocket = this.closeSocketSubject.pipe(
        map((url: string) => {
            this.socketsMap.get(url).close()

            return this.socketsMap.delete(url)
        }),
    )

    /**
     * Stream of registered sockets
     */
    sockets = this.initSocket().pipe(
        merge(this.openSocketSubject, this.closeSocket),
        map(() => Array.from(this.socketsMap.values())),
    )

    /**
     * Stream of events from *all* open sockets
     * @return {[type]} [description]
     */
    $ = this.initSocket().pipe(
        merge(this.openSocketSubject), // Subscribe to new sockets as they come through
        mergeMap(socket => socket.$), // Connects socket
        share(), // Only want one instance
    )

    send(msg) {
        this.sockets
            .pipe(
                map(x => {
                    x.map(y => y.send())
                }),
            )
            .subscribe()
    }
    /**
     * Return all previously registered sockets
     */
    initSocket() {
        return from(this.socketsMap.values())
    }

    /**
     * Register a websocket
     * @param  {string} url   URL to connect to socket
     * @param  {string} token Optional auth token
     */
    open(url: string, token?: string) {
        this.socketsMap.set(
            url,
            webSocket(url, socket => {
                if (token) {
                    socket.send("login:" + token)
                    setTimeout(() => socket.send("s-h"), 1000)
                }
            }),
        )

        this.openSocketSubject.next(this.socketsMap.get(url))
    }

    /**
     * Close a socket by key
     */
    close(url) {
        // key instead of url?
        this.closeSocketSubject.next(url)
    }
}

const service = new SocketService()

service.open("ws://localhost:8080")
service.open("ws://localhost:8081")

service.$.pipe(map(msg => msg)).subscribe(msg => console.log(msg))
service.send("test")
