import { writeFileSync } from 'fs'
import { bookTex } from '../src/book'
import { he } from './he'

if (module === require.main) {
    const heTex = bookTex(he)
    writeFileSync('he.tex', heTex, 'utf-8')

    const engTex = bookTex(he)
    writeFileSync('eng.tex', engTex, 'utf-8')

}