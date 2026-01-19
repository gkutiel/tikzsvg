import { $ } from "bun"
import { mkdir, writeFile } from "node:fs/promises"
import PQueue from "p-queue"
import { Book, bookTex } from "./book"
import { Cover, coverTex } from "./cover"

const q = new PQueue({ concurrency: 1 })


async function tmpDir() {
    const id = crypto.randomUUID()
    const tmp = `/tmp/doks/${id}`
    await mkdir(tmp, { recursive: true })
    await $`ln -s ${process.cwd()}/Fredoka-Bold.ttf ${tmp}/Fredoka-Bold.ttf`
    await $`ln -s ${process.cwd()}/Fredoka-Regular.ttf ${tmp}/Fredoka-Regular.ttf`

    return tmp
}

interface Build {
    tmp: string,
    tex: string
}

async function pdf({ tmp, tex }: Build) {

    await writeFile(`${tmp}/main.tex`, tex)

    // Run twice to resolve "current page" coordinates
    const runTex = () => $`xelatex -interaction=nonstopmode main.tex`.cwd(tmp).quiet()
    await q.add(async () => {
        await runTex()
        await runTex()
    })
    const pdf = await Bun.file(`${tmp}/main.pdf`).arrayBuffer()

    return new Response(pdf, {
        headers: {
            "Content-Type": "application/pdf"
        }
    })
}

async function book(req: Request) {
    const body = await req.json()
    const book = Book.parse(body)

    const tmp = await tmpDir()
    await Promise.all(book.pages.map(async (page, i) => {
        console.log(`Writing page ${i} jpg`)
        writeFile(`${tmp}/${i}.jpg`, Buffer.from(page.jpgBase64, 'base64'))
    }))

    const tex = bookTex(book)
    return pdf({ tmp, tex })
}

async function cover(req: Request) {
    const body = await req.json()
    const cover: Cover = Cover.parse(body)

    const tex = coverTex(cover)
    const tmp = await tmpDir()
    await writeFile(`${tmp}/cover.jpg`, Buffer.from(cover.jpgBase64, 'base64'))
    return pdf({ tmp, tex })
}

const server = Bun.serve({
    port: 3000,
    routes: {
        "/book": book,
        "/cover": cover
    },
    fetch(req) {
        return new Response('Hello from booky.kids!\n', { status: 200 })
    },
    error(err) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})

console.log(`Server running at http://localhost:${server.port}/`)