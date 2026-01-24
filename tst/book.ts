import { writeFileSync } from 'fs'
import { bookTex } from '../src/book'
import { en } from './en'
import { he } from './he'

if (module === require.main) {
    const heTex = bookTex(he)
    writeFileSync('he.tex', heTex, 'utf-8')

    const engTex = bookTex(en)
    writeFileSync('en.tex', engTex, 'utf-8')

}