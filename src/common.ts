import assert from 'assert'
import sax from 'sax'
import { z } from 'zod'
import { emojiMap } from './emojis'

export const color = z.string().length(7)
export const gradient = z.array(color).length(2)

export type Emoji = z.infer<typeof Emoji>
export const Emoji = z.object(emojiMap).keyof()

const langs = ['he', 'en'] as const
export type Lang = typeof langs[number]
export const Lang = z.enum(langs)

type LangConfig = {
    name: string
    script: string
}

const langConfig: { [key in Lang]: LangConfig } = {
    he: { name: 'hebrew', script: 'Hebrew' },
    en: { name: 'english', script: 'Latin' },
}

export const langName: { [key in Lang]: string } = {
    he: langConfig.he.name,
    en: langConfig.en.name,
}

export const script: { [key in Lang]: string } = {
    he: langConfig.he.script,
    en: langConfig.en.script,
}

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

const Ellipse = z.object({
    type: z.literal("ellipse"),
    cx: z.number(),
    cy: z.number(),
    rx: z.number(),
    ry: z.number(),
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
const Element = z.union([Group, Path, Circle, Ellipse])

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
        res[res.length - 1]?.kids.push({ ...e, fill: hex(e.fill) })
    }

    const open: Open = {
        circle(attrs) {
            push({ type: "circle", ...attrs })
        },
        ellipse(attrs) {
            push({ type: "ellipse", ...attrs })
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
        ellipse() { },
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

export function colorMap(colors: Set<string | undefined>) {
    colors.delete(undefined)
    return Object.fromEntries(Array.from(colors).filter((c): c is string => c !== undefined).map((c, i) => [c, i]))
}

export function getColors(e: Element): (string | undefined)[] {
    if (e.type === 'g') return [e.fill, ...e.kids.flatMap(getColors)]
    return [e.fill]
}

function fillStr(fill: string | undefined, colors: Record<string, number>) {
    if (!fill) return ''
    assert(fill in colors, `Color ${fill} not in ${Object.keys(colors)}`)
    return `fill=c${colors[fill]}`
}

type To = {
    [t in types]: (args: Extract<Element, { type: t }>, colors: Record<string, number>) => string
}

const toTikz: To = {
    circle({ cx, cy, r, fill }, colors) {
        return `\\fill[${fillStr(fill, colors)}] (${cx}, ${cy}) circle (${r});`
    },

    ellipse({ cx, cy, rx, ry, fill }, colors) {
        return `\\fill[${fillStr(fill, colors)}] (${cx}, ${cy}) ellipse (${rx} and ${ry});`
    },

    path({ d, fill }, colors) {
        return `\\fill[${fillStr(fill, colors)}] svg {${d}};`
    },

    g({ fill, kids }, colors) {
        return [
            `\\begin{scope}[${fillStr(fill, colors)}]`,
            ...kids.map(e => toTikz[e.type](e as any, colors)),
            `\\end{scope}`
        ].join('\n')
    }
}

export function defineColors(colors: Record<string, number>) {
    return Object.entries(colors).map(([color, i]) => `\\definecolor{c${i}}{HTML}{${color.replace('#', '')}}`).join('\n')
}

export interface Transform {
    x: number
    y: number
    scale: number
    rotate: number
}

export function svgTex({ x, y, scale, rotate }: Transform, es: Element[], colors: Record<string, number>) {
    return String.raw`
\begin{scope}[x=1pt, y=1pt, xshift=${x}, scale=${scale}, yscale=-1, yshift=${y}, rotate=${rotate}]
${es.map(e => toTikz[e.type](e as any, colors)).join('\n')}
\end{scope}`
}

export function poly(lang: Lang) {
    const name = langName[lang]
    return String.raw`
\usepackage{polyglossia}
\setmainlanguage{${name}}
% Ensure this file exists in your project folder!
${['\\newfontfamily', `${name}font[`].join('\\')}
Script=${script[lang]},
Path=./,
Extension=.ttf,
UprightFont=*-Regular,
BoldFont=*-Bold
]{Fredoka}`
}

type MiniPage = z.infer<typeof MiniPage>
const MiniPage = z.object({
    vAlign: z.enum(['t', 'c', 'b']),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
    content: z.string(),
})
export function minipage(raw: MiniPage) {
    const { vAlign, width, height, content } = MiniPage.parse(raw)
    return String.raw`\fbox{%
\begin{minipage}[c][${height}\textheight][${vAlign}]{${width}\textwidth}
${content}
\end{minipage}}%`
}

type Background = z.infer<typeof Background>
const Background = z.object({
    gradient: gradient,
    tikz: z.string(),
    colors: z.record(z.string(), z.number()),
})

export function background(raw: Background) {
    const { gradient: [c1, c2], tikz, colors } = Background.parse(raw)
    assert(c1 && c2, "Gradient must have two colors")
    const g1 = colors[c1]
    const g2 = colors[c2]
    return String.raw`\begin{tikzpicture}[remember picture, overlay]
\shade [left color=c${g1}, right color=c${g2}, shading angle=45] 
(current page.south west) rectangle (current page.north east);
${tikz}
\end{tikzpicture}%`
}

type TextBackground = z.infer<typeof TextBackground>
const TextBackground = z.object({
    yshift: z.number(),
    xshift: z.number(),
    xscale: z.number(),
    yscale: z.number(),
    color: color,
    opacity: z.number().min(.1).max(1),

})
export function txtBackground(raw: TextBackground) {
    const { yshift, xshift, xscale, yscale, color, opacity } = TextBackground.parse(raw)
    return String.raw`\fill[
yshift=${yshift},
xshift=${xshift},
xscale=${xscale},
yscale=${yscale},
fill=${color}, 
opacity=${opacity}] svg "M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05";`
}


type Img = z.infer<typeof Img>
const Img = z.object({
    src: z.string(),
})
export function img(raw: Img) {
    const { src } = Img.parse(raw)
    return String.raw`\begin{scope}
\clip[
scale=349,
xshift=-.5,
yshift=-.5,
] svg "M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05";
\node[opacity=.75] at (0,0) {\includegraphics[width=12cm]{${src}}};
\end{scope}`
}

export function tikzpicture(content: string) {
    return String.raw`\begin{tikzpicture}
${content}
\end{tikzpicture}%`
}

export function vspace(cm: number) {
    return `\\vspace{${cm}cm}`
}

export function Huge(text: string) {
    return `\\Huge ${text}`
}

export function Large(text: string) {
    return `\\Large ${text}`
}

export function large(text: string) {
    return `\\large ${text}`
}

export function normalsize(text: string) {
    return `\\normalsize ${text}`
}

export const vfill = `\\vspace*{\\fill}`
export const centering = '\\centering'