import z from 'zod'

const emoji = `<g><path fill="#3E721D" d="M28 27c-8 0-8 6-8 6V22h-4v11s0-6-8-6c-4 0-7-2-7-2s0 9 9 9h6s0 2 2 2 2-2 2-2h6c9
 0 9-9 9-9s-3 2-7 2z"/><path fill="#FFAC33" d="M21.125 27.662c-.328 0-.651-.097-.927-.283l-2.323-1.575-2.322 1.575
c-.277.186-.601.283-.929.283-.143 0-.287-.018-.429-.057-.462-.123-.851-.441-1.06-.874l-1.225-2.527-2.797.204c-.04.
002-.079.004-.119.004-.438 0-.86-.174-1.17-.484-.34-.342-.516-.81-.481-1.288l.201-2.8-2.523-1.225c-.432-.209-.751-
.598-.876-1.062-.125-.464-.042-.958.228-1.356l1.573-2.323-1.573-2.322c-.27-.398-.353-.892-.228-1.357.125-.462.444-
.851.876-1.06L7.544 7.91l-.201-2.797c-.034-.48.142-.951.481-1.289.31-.312.732-.485 1.17-.485.04 0 .079 0 .119.003l
2.797.201 1.225-2.523c.209-.432.598-.751 1.06-.876.142-.038.285-.057.429-.057.328 0 .651.098.929.285l2.322 1.573L2
0.198.372c.275-.188.599-.285.927-.285.144 0 .29.02.428.057.465.125.854.444 1.062.876l1.225 2.523 2.8-.201c.037-.00
3.078-.003.116-.003.438 0 .858.173 1.172.485.338.338.515.809.48 1.289l-.204 2.797 2.527 1.225c.433.209.751.598.874
 1.06.124.465.043.96-.227 1.357l-1.575 2.322 1.575 2.323c.269.398.351.892.227 1.356-.123.464-.441.852-.874 1.062l-
2.527 1.225.204 2.8c.034.478-.143.946-.48 1.288-.313.311-.734.484-1.172.484-.038 0-.079-.002-.116-.004l-2.8-.204-1
.225 2.527c-.209.433-.598.751-1.062.874-.139.04-.284.057-.428.057z"/><circle fill="#732700" cx="18" cy="14" r="7"/
></g>`

type Path = z.infer<typeof Path>
const Path = z.object({
    type: z.literal("path"),
    d: z.string(),
    fill: z.string(),
})

type Circle = z.infer<typeof Circle>
const Circle = z.object({
    type: z.literal("circle"),
    cx: z.number(),
    cy: z.number(),
    r: z.number(),
    fill: z.string(),
})


type types = Element["type"]
type Element = z.infer<typeof Element>
const Element = z.union([Path, Circle])

type Emoji = z.infer<typeof Emoji>
const Emoji = z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number(),
    rotate: z.number(),
    elements: z.array(Element),
})

type From = {
    [t in types]: (attrs: Record<string, string>) => Extract<Element, { type: t }>
}

const FromSvg: From = {
    circle: ({ cx, cy, r, fill, stroke, strokeWidth }) => ({
        type: "circle",
        cx: Number(cx),
        cy: Number(cy),
        r: Number(r),
        fill: fill,
        stroke: stroke,
        strokeWidth: strokeWidth ? Number(strokeWidth) : undefined,
    }),

    path: ({ d, fill, stroke, strokeWidth }) => ({
        type: "path",
        d: d,
        fill: fill,
        stroke: stroke,
        strokeWidth: strokeWidth ? Number(strokeWidth) : undefined,
    }),
}

interface Tag {
    tag: types
    attributes: Record<string, string>
}

function parseSvg(svg: string): Tag[] {
    const tag = /<(\w+)([^>]*)\/?>/g
    const attr = /(\w+(?:-\w+)?)\s*=\s*(["'])([\s\S]*?)\2/g
    const tags = svg.replaceAll('\n', '').matchAll(tag)
    return Array.from(tags).map(tag => {
        return {
            tag: tag[1] as types,
            attributes: Array.from(tag[2].matchAll(attr)).reduce((acc, [, name, , value]) => {
                acc[name] = value
                return acc
            }, {} as Record<string, string>),
        }
    })
}

export function fromSvg(svg: string): Element[] {
    return parseSvg(svg).map(tag => {
        const fn = FromSvg[tag.tag]
        if (!fn) {
            console.warn(`Unsupported tag: <${tag.tag}>`)
            return null
        }
        return fn(tag.attributes)
    }).filter((e): e is Element => e !== null)
}


type To = {
    [t in types]: (args: Extract<Element, { type: t }>) => string
}

const ToTikz: To = {
    circle: ({ cx, cy, r, fill }) => {
        return `\\fill [fill=${fill}] (${cx}, ${cy}) circle (${r});`
    },

    path: ({ d, fill }) => {
        return `\\fill [fill=${fill}] svg {${d}};`
    },
}

type Page = z.infer<typeof Page>
const Page = z.object({
    gradient: z.array(z.string()).length(2),
    textBg: z.string(),
    text: z.array(z.string()),
    emojis: z.array(Emoji),
})

type Book = z.infer<typeof Book>
const Book = z.object({
    pages: z.array(Page),
})

function colorMap(colors: Set<string>) {
    colors.delete(undefined)
    return Object.fromEntries(Array.from(colors).map((c, i) => [c, i]))
}

function toTex(book: Book) {
    const pages = book.pages

    const gradColors = pages.flatMap<string>(p => p.gradient)
    const textBgColors = pages.map(p => p.textBg)
    const emojiColors = pages.flatMap(p => p.emojis.flatMap(es => es.elements.map<string>(e => e.fill)))
    const colors = colorMap(new Set<string>([
        ...gradColors,
        ...textBgColors,
        ...emojiColors
    ]))

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
        const es = page.emojis.map(emoji => String.raw`
        \begin{scope}[x=1pt, y=1pt, xshift=${emoji.x}, scale=${emoji.scale}, yscale=-1, yshift=${emoji.y}, rotate=${emoji.rotate}]
            ${emoji.elements.map(e => ToTikz[e.type]({
            ...e,
            fill: `c${colors[e.fill]}`,
        } as Element as any)).join('\n')}
        \end{scope}
        `).join('\n')

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
    const book: Book = {
        pages: [
            {
                gradient: ['#8B4513', '#FFD1E0'],
                textBg: '#FFF3E6',
                emojis: [
                    {
                        x: 10,
                        y: 20,
                        scale: 1.8,
                        rotate: -15,
                        elements: fromSvg(emoji)
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