import { $ } from "bun"
import { mkdir, writeFile } from "node:fs/promises"
import PQueue from "p-queue"
import { Book, toTex } from "./book"

const q = new PQueue({ concurrency: 1 })
const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const body = await req.json()
        const book = Book.parse(body)

        const id = crypto.randomUUID()
        const tmp = `/tmp/doks/${id}`
        await mkdir(tmp, { recursive: true })
        await $`ln -s ${process.cwd()}/Fredoka-Bold.ttf ${tmp}/Fredoka-Bold.ttf`

        const tex = toTex(book)
        await writeFile(`${tmp}/book.tex`, tex)
        await Promise.all(book.pages.map(async (page, i) => {
            console.log(`Writing page ${i} jpg`)
            writeFile(`${tmp}/${i}.jpg`, Buffer.from(page.jpgBase64, 'base64'))
        }))

        // Run twice to resolve "current page" coordinates
        const runTex = () => $`xelatex -interaction=nonstopmode book.tex`.cwd(tmp).quiet()
        await q.add(async () => {
            await runTex()
            await runTex()
        })
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