import assert from 'assert'
import sax from 'sax'
import z from 'zod'
import { emojiMap } from './emojis'

type Path = z.infer<typeof Path>
const Path = z.object({
    type: z.literal("path"),
    d: z.string(),
    fill: z.string().optional(),
})

type Circle = z.infer<typeof Circle>
const Circle = z.object({
    type: z.literal("circle"),
    cx: z.number(),
    cy: z.number(),
    r: z.number(),
    fill: z.string().optional(),
})

type Group = z.infer<typeof Group>
const Group = z.object({
    type: z.literal("g"),
    fill: z.string().optional(),
    get kids() {
        return z.array(Element)
    }
})



type types = Element["type"]
type Element = z.infer<typeof Element>
const Element = z.union([Group, Path, Circle])


type Emoji = z.infer<typeof Emoji>
const Emoji = z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number(),
    rotate: z.number(),
    emoji: z.string()
})

type Open = {
    [t in types]: (args: Omit<Extract<Element, { type: t }>, "type">) => void
}

type Close = {
    [t in types]: () => void
}

function hex(s: string | undefined): string | undefined {
    if (!s) return
    const res = s.replace('#', '')
    assert([3, 6].includes(res.length), `Color ${s} is not valid hex`)
    return res.length === 3 ? res.split('').map(c => c + c).join('') : res
}

export function fromSvg(svg: string): Group[] {

    const res: Group[] = [{
        type: "g",
        kids: [],
    }]

    function push(e: Element) {
        res[res.length - 1].kids.push({ ...e, fill: hex(e.fill) })
    }

    const open: Open = {
        circle(attrs) {
            push({ type: "circle", ...attrs })
        },
        path(attrs) {
            push({ type: "path", ...attrs })
        },
        g({ fill }) {
            res.push({
                type: "g",
                fill: hex(fill),
                kids: [],
            })
        },
    }

    const close: Close = {
        circle() { },
        path() { },
        g() {
            res.push({
                type: "g",
                kids: [],
            })
        },
    }

    const p = sax.parser(true)

    p.onopentag = ({ name, attributes }) => {
        if (!(name in open)) {
            console.log('unknown tag', name)
            return
        }
        open[name as types](attributes as any)
    }

    p.onclosetag = (name) => {
        if (!(name in close)) {
            console.log('unknown tag', name)
            return
        }
        close[name as types]()
    }

    p.write(svg).close()



    return res
}


type Page = z.infer<typeof Page>
const Page = z.object({
    gradient: z.array(z.string()).length(2),
    textBg: z.string(),
    text: z.array(z.string()),
    emojis: z.array(Emoji),
    jpgBase64: z.string().max(256_000)
})

type Book = z.infer<typeof Book>
const Book = z.object({
    pages: z.array(Page),
})

function colorMap(colors: Set<string>) {
    colors.delete(undefined)
    return Object.fromEntries(Array.from(colors).map((c, i) => [c, i]))
}

function getColors(e: Element): string[] {
    if (e.type === 'g') return [e.fill, ...e.kids.flatMap(getColors)]
    return [e.fill]
}

function toTex(book: Book) {
    const pages = book.pages

    const emojis = Object.fromEntries(
        pages.flatMap(p => p.emojis.map(e =>
            [e.emoji, {
                ...e,
                emoji: fromSvg(emojiMap[e.emoji])
            }]
        )))

    const gradColors = pages.flatMap<string>(p => p.gradient)
    const textBgColors = pages.map(p => p.textBg)
    const emojiColors = Object.values(emojis).flatMap(es => es.emoji.flatMap(getColors))
    const colors = colorMap(new Set<string>([
        ...gradColors,
        ...textBgColors,
        ...emojiColors
    ]))

    type To = {
        [t in types]: (args: Extract<Element, { type: t }>) => string
    }

    function fillStr(fill?: string) {
        if (!fill) return ''
        assert(fill in colors, `Color ${fill} not in ${Object.keys(colors)}`)
        return `fill=c${colors[fill]}`
    }

    const ToTikz: To = {
        circle({ cx, cy, r, fill }) {
            return `\\fill[${fillStr(fill)}] (${cx}, ${cy}) circle (${r});`
        },

        path({ d, fill }) {
            return `\\fill[${fillStr(fill)}] svg {${d}};`
        },

        g({ fill, kids }) {
            return [
                `\\begin{scope}[${fillStr(fill)}]`,
                ...kids.map(e => ToTikz[e.type](e as any)),
                `\\end{scope}`
            ].join('\n')
        }
    }

    console.log('Colors used:', colors)

    return String.raw`
\documentclass[a5paper, oneside]{article}
\usepackage[utf8]{inputenc}
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


${Object.entries(colors).map(([color, i]) => `\\definecolor{c${i}}{HTML}{${color.replace('#', '')}}`).join('\n')}

\begin{document}

\pagestyle{bigpagenumbers}

\mbox{} 
\newpage

${book.pages.map((page, i) => {
        const [c1, c2] = page.gradient
        const es = page.emojis.map(({ emoji, x, y, scale, rotate }) => String.raw`
        \begin{scope}[x=1pt, y=1pt, xshift=${x}, scale=${scale}, yscale=-1, yshift=${y}, rotate=${rotate}]
            ${emojis[emoji].emoji.map(e => {
            console.log(e)
            return ToTikz[e.type](e as any)
        }).join('\n')}
        \end{scope}`).join('\n')

        return String.raw`
    \begin{tikzpicture}[remember picture, overlay]
        \shade[shading=axis, bottom color=c${colors[c1]}, top color=c${colors[c2]}, shading angle=45] 
        (current page.south west) rectangle ([xshift=148.5mm]current page.north east);
        \fill[
            opacity=0.5,
            color=c${colors[page.textBg]},
            yshift=-20,
            xscale=380,
            yscale=-500,
            ] svg {M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05};

        ${es}
    \end{tikzpicture}

\vspace*{\fill}
\begin{center}
    \begin{minipage}{10cm}
        \Huge 
        \raggedleft
        ${page.text.map(line => line.trim()).join('\\\\')}
    \end{minipage}
\end{center}
\vspace*{\fill}
    
    \newpage
    
    \begin{tikzpicture}[remember picture, overlay]
    \shade[shading=axis, bottom color=c${colors[c1]}, top color=c${colors[c2]}, shading angle=45] 
    ([xshift=-148.5mm]current page.south west) rectangle (current page.north east);
    \end{tikzpicture}
    
    \vspace*{\fill}
        \begin{tikzpicture}
            \clip[
                xshift=-190, 
                yshift=190,
                scale=380, 
                yscale=-1] svg {M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05};
            \node[opacity=0.8] {\includegraphics[width=13.1cm]{img.jpg}};
        \end{tikzpicture}
    \vspace*{\fill}    
    
    \newpage
`
    })}

\end{document}`
}

if (require.main === module) {
    const buffer = await Bun.file('img.jpg').arrayBuffer()
    const jpgBase64 = Buffer.from(buffer).toString('base64')
    const book: Book = {
        pages: [
            {
                jpgBase64,
                gradient: ['#8B4513', '#FFD1E0'],
                textBg: '#FFF3E6',
                emojis: [
                    {
                        x: 10,
                        y: 20,
                        scale: 1.8,
                        rotate: -15,
                        emoji: '🌸'
                    }
                ],
                text: [
                    'שלי בת השש-עשרה רצה למטבח.',
                    'היא רצתה עוגיות שוקולד טעימות!',
                    'אבל אוי ואבוי!',
                    'הקופסה הייתה ריקה לגמרי!'
                ],
            },
        ]
    }

    const tex = toTex(book)
    require('fs').writeFileSync('output.tex', tex)
}