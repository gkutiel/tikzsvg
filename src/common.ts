import assert from 'assert'
import sax from 'sax'
import { z } from 'zod'

export const gradient = z.array(z.string()).length(2)

export type Transform = z.infer<typeof Transform>
export const Transform = z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number(),
    rotate: z.number(),
})

export type Emoji = z.infer<typeof Emoji>
export const Emoji = Transform.extend({
    emoji: z.string().max(8)
})

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

type Open = {
    [t in types]: (args: Omit<Extract<Element, { type: t }>, "type">) => void
}

type Close = {
    [t in types]: () => void
}

export function hex(s: string | undefined): string | undefined {
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

export function colorMap(colors: Set<string | undefined>) {
    colors.delete(undefined)
    return Object.fromEntries(Array.from(colors).filter((c): c is string => c !== undefined).map((c, i) => [c, i]))
}

export function getColors(e: Element): (string | undefined)[] {
    if (e.type === 'g') return [e.fill, ...e.kids.flatMap(getColors)]
    return [e.fill]
}

export function fillStr(fill: string | undefined, colors: Record<string, number>) {
    if (!fill) return ''
    assert(fill in colors, `Color ${fill} not in ${Object.keys(colors)}`)
    return `fill=c${colors[fill]}`
}

type To = {
    [t in types]: (args: Extract<Element, { type: t }>, colors: Record<string, number>) => string
}

export const toTikz: To = {
    circle({ cx, cy, r, fill }, colors) {
        return `\\fill[${fillStr(fill, colors)}] (${cx}, ${cy}) circle (${r});`
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

export function svgTex({ x, y, scale, rotate }: Transform, es: Element[], colors: Record<string, number>) {
    return String.raw`
\begin{scope}[x=1pt, y=1pt, xshift=${x}, scale=${scale}, yscale=-1, yshift=${y}, rotate=${rotate}]
${es.map(e => toTikz[e.type](e as any, colors)).join('\n')}
\end{scope}`
}