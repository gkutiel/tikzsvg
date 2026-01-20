import { writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { Book, bookTex } from '../src/book'

if (module === require.main) {
    const data = await readFile('book.json', 'utf-8').then(JSON.parse)
    const book = Book.parse(data)
    const tex = bookTex(book)

    // Generate the .tex file
    writeFileSync('book.tex', tex, 'utf-8')
}