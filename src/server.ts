import { $ } from "bun"
import { mkdir, writeFile } from "node:fs/promises"
import PQueue from "p-queue"
import { Book, toTex } from "./page"

const q = new PQueue({ concurrency: 1 })
const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const body = await req.json()
        const book = Book.parse(body)

        const id = crypto.randomUUID()
        const tmp = `/tmp/${id}`
        await mkdir(tmp, { recursive: true })

        const tex = toTex(book)
        await writeFile(`${tmp}/book.tex`, tex)
        await q.add(() => $`xelatex -interaction=nonstopmode -output-directory=${tmp} ${tmp}/book.tex`)
        const pdf = await Bun.file(`${tmp}/book.pdf`).arrayBuffer()

        return new Response(pdf, {
            headers: {
                "Content-Type": "application/pdf"
            }
        })
    },
    error(err) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})

console.log(`Server running at http://localhost:${server.port}/`)