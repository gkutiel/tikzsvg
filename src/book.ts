import assert from 'assert'
import z from 'zod'
import { color, colorMap, defineColors, Emoji, fromSvg, getColors, gradient, Lang, svgTex, type Transform } from './common'
import { emojiMap } from './emojis'


type Page = z.infer<typeof Page>
const Page = z.object({
    gradient: gradient,
    textBg: z.string(),
    text: z.string().max(1024),
    emojis: z.object({
        text: z.array(Emoji).length(3),
        image: z.array(Emoji).length(3),
    }),
    jpgBase64: z.string().max(256_000)
})

export type Book = z.infer<typeof Book>
export const Book = z.object({
    lang: Lang,

    // FIRST PAGE
    color: color,
    title: z.string().max(256),
    author: z.string().max(256),
    date: z.coerce.date(),
    heroJpgBase64: z.string().max(256_000),

    // OTHER PAGES
    pages: z.array(Page),
})

const TRANSFORMS_TEXT: Transform[] = [
    { x: 10, y: 15, scale: 2.3, rotate: -15, },
    { x: 300, y: 220, scale: 2.1, rotate: 15, },
    { x: 10, y: 280, scale: 1.7, rotate: -10, },
]

const TRANSFORMS_IMAGE: Transform[] = [
    { x: -170, y: -120, scale: 1.8, rotate: -15 },
    { x: 130, y: -120, scale: 2.2, rotate: 15 },
    { x: 100, y: 80, scale: 2.3, rotate: 10 }
]

export function bookTex(book: Book) {
    const pages = book.pages

    const emojiElements = Object.fromEntries(
        pages.flatMap(p => [...p.emojis.text, ...p.emojis.image].map(emoji => {
            const svg = emojiMap[emoji]
            return [emoji, fromSvg(svg!)]
        })))

    const gradColors = pages.flatMap(p => p.gradient)
    const textBgColors = pages.map(p => p.textBg)
    const emojiColors = Object.values(emojiElements).flatMap(es => es.flatMap(getColors))
    const colors = colorMap(new Set([
        book.color,
        ...gradColors,
        ...textBgColors,
        ...emojiColors
    ]))

    return String.raw`
\documentclass[a5paper, oneside]{article}
\usepackage[margin=0cm,bottom=2cm]{geometry}
\usepackage{tikz}
\usetikzlibrary{svg.path}

\usepackage{fancyhdr}

\fancypagestyle{bigpagenumbers}{
\fancyhf{} 
\renewcommand{\headrulewidth}{0pt} 
\fancyfoot[C]{\Huge\thepage} 
}

\usepackage{polyglossia}
\setmainlanguage{hebrew}
\newfontfamily\hebrewfont[
Script=Hebrew,
Path=./,                
BoldFont={Fredoka-Bold.ttf} 
]{Fredoka-Bold.ttf}


${defineColors(colors)}

\begin{document}

\pagestyle{bigpagenumbers}

\pagecolor{c${colors[book.color]}!60}

\vspace*{\fill}

\begin{center}
\begin{tikzpicture}
\clip[] (0,0) circle (3.5cm);
\node[opacity=0.8] at (0,0) {\includegraphics[width=7cm]{hero.jpg}};  
\end{tikzpicture}

\vspace{1cm}
\Huge \textbf{${book.title}}\\[1cm]
\LARGE ${book.author} \\[1cm]
\normalsize \today \\[2cm]
\end{center}
\vspace*{\fill}

\newpage
\nopagecolor

${book.pages.map((page, i) => {
        const [c1, c2] = page.gradient

        assert(c1 && c2, `Gradient colors ${page.gradient} must be defined in page ${i}`)

        function emojisTex(emojis: string[], transforms: Transform[]) {
            assert(emojis.length <= transforms.length)
            return emojis.map((emoji, i) => {
                const els = emojiElements[emoji]!
                return svgTex(transforms[i]!, els, colors)
            }).join('\n')
        }

        const esText = emojisTex(page.emojis.text, TRANSFORMS_TEXT)
        const esImage = emojisTex(page.emojis.image, TRANSFORMS_IMAGE)
        const rtl = book.lang === 'he'

        const image = String.raw`
\begin{tikzpicture}[remember picture, overlay]
\shade[shading=axis, bottom color=c${colors[c1]}, top color=c${colors[c2]}, shading angle=45] 
([xshift=-148.5mm]current page.south west) rectangle (current page.north east);
\end{tikzpicture}

\vspace*{\fill}
\begin{tikzpicture}
\begin{scope}
\clip[
xshift=-190, 
yshift=190,
scale=380, 
yscale=-1] svg {M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05};
\node[opacity=0.8] {\includegraphics[width=13.1cm]{${i}.jpg}};
\end{scope}
${esImage}
\end{tikzpicture}
\vspace*{\fill}
\newpage
`

        const text = String.raw`
\begin{tikzpicture}[remember picture, overlay]
\shade[shading=axis, bottom color=c${colors[c1]}, top color=c${colors[c2]}, shading angle=45] 
(current page.south west) rectangle ([xshift=148.5mm]current page.north east);
\fill[
opacity=0.2,
color=c${colors[page.textBg]},
yshift=-20,
xscale=380,
yscale=-500,
] svg {M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05};

${esText}
\end{tikzpicture}

\vspace*{\fill}
\begin{center}
\begin{minipage}{10cm}
\Huge 
\raggedleft
${page.text}
\end{minipage}
\end{center}
\vspace*{\fill}
\newpage
`

        return [
            rtl ? image : text,
            rtl ? text : image,
        ].join('\n\n')
    }).join('\n\n')}

\end{document}`
}

