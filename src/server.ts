import PQueue from "p-queue"
import { Book } from "./page"

const q = new PQueue({ concurrency: 1 })
const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const body = await req.json()
        const book = Book.parse(body)
        const emojis = book.pages[0]?.emojis
        return new Response(JSON.stringify((emojis)))
    },
    error(err) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})

console.log(`Server running at http://localhost:${server.port}/`)