import { writeFileSync } from 'fs'
import { Book, bookTex } from '../src/book'

// Example book with 2 pages
const exampleBook: Book = {
    lang: 'he',

    // First page data
    color: '#FF6B6B',
    title: 'הספר שלי',
    author: 'דנה כהן',
    date: new Date('2024-01-15'),
    heroJpgBase64: '',  // Not used in LaTeX output

    // 2 pages
    pages: [
        {
            gradient: ['#95E1D3', '#F38181'],
            textBg: '#EAFFD0',
            text: 'פעם, ביער קסום, חי שועל קטן וסקרן שאהב לחקור את העולם.',
            emojis: {
                text: ['🌸', '🌼', '🌺'],
                image: ['🦊', '🌳', '🌿']
            },
            jpgBase64: ''  // Not used in LaTeX output
        },
        {
            gradient: ['#AA96DA', '#FCBAD3'],
            textBg: '#FFFFD2',
            text: 'השועל אהב לחקור ולהכיר חברים חדשים בין הפרחים והעצים.',
            emojis: {
                text: ['🐶', '🐱', '🐰'],
                image: ['🌻', '🌷', '🍄']
            },
            jpgBase64: ''  // Not used in LaTeX output
        }
    ]
}

if (module === require.main) {
    const tex = bookTex(exampleBook)

    // Generate the .tex file
    writeFileSync('book.tex', tex, 'utf-8')

    console.log('✓ Generated book.tex')
    console.log('\nTo compile this LaTeX file, you need:')
    console.log('1. A LaTeX distribution (e.g., TeX Live, MiKTeX)')
    console.log('2. The Fredoka-Bold.ttf font in the same directory')
    console.log('3. Create placeholder images: 0.jpg and 1.jpg (or img.jpg renamed)')
    console.log('\nRun: xelatex book.tex')
}