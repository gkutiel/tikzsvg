import { writeFileSync } from 'fs'
import { coverTex } from '../src/cover'
import { en_cover } from './en.cover'
// import { he_cover } from './he.cover'

if (module === require.main) {
    // const heTex = coverTex(he_cover)
    // writeFileSync('he_cover.tex', heTex, 'utf-8')

    const engTex = coverTex(en_cover)
    writeFileSync('en_cover.tex', engTex, 'utf-8')
}