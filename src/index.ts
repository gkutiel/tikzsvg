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

function tikzDoc(tikz: string) {
    return `\\documentclass{standalone}
\\usepackage{tikz}
\\usepackage[HTML]{xcolor}
\\usetikzlibrary{svg.path}
\\begin{document}
${tikz}
\\end{document}`
}

function svgDoc(svg: string) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 48 48">${svg}</svg>`
}

export namespace tikzsvg {
    export interface Common {
        fill?: string
        stroke?: string
        strokeWidth?: number
    }

    export interface Path extends Common {
        type: "path"
        d: string
    }

    export interface Circle extends Common {
        type: "circle"
        cx: number
        cy: number
        r: number
    }

    export type Element = Path | Circle

    type types = Element["type"]

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

    const ToSvg: To = {
        circle: ({ cx, cy, r, fill, stroke, strokeWidth }) => {
            const attrs = [
                `cx="${cx}"`,
                `cy="${cy}"`,
                `r="${r}"`,
                fill ? `fill="${fill}"` : '',
                stroke ? `stroke="${stroke}"` : '',
                strokeWidth ? `stroke-width="${strokeWidth}"` : '',
            ].filter(Boolean).join(' ')
            return `<circle ${attrs}/>`
        },

        path: ({ d, fill, stroke, strokeWidth }) => {
            const attrs = [
                `d="${d}"`,
                fill ? `fill="${fill}"` : '',
                stroke ? `stroke="${stroke}"` : '',
                strokeWidth ? `stroke-width="${strokeWidth}"` : '',
            ].filter(Boolean).join(' ')

            return `<path ${attrs}/>`
        }
    }

    export function toSvg(elements: Element[]): string {
        return elements.map(e => ToSvg[e.type](e as any)).join('')
    }

    const ToTikz: To = {
        circle: ({ cx, cy, r, fill, stroke, strokeWidth }) => {
            const attrs = [
                fill ? `fill=${fill}` : '',
                stroke ? `draw=${stroke}` : '',
                strokeWidth ? `line width=${strokeWidth}pt` : '',
            ].filter(Boolean).join(', ')

            const cmd = stroke ? '\\draw' : '\\fill'
            return `${cmd} [${attrs}] (${cx}, ${cy}) circle (${r});`
        },

        path: ({ d, fill, stroke, strokeWidth }) => {
            const attrs = [
                fill ? `fill=${fill}` : '',
                stroke ? `draw=${stroke}` : '',
                strokeWidth ? `line width=${strokeWidth}pt` : '',
            ].filter(Boolean).join(', ')

            const cmd = stroke ? '\\draw' : '\\fill'
            return `${cmd} [${attrs}] svg {${d}};`
        },
    }

    export function toTikz(elements: Element[]): string {
        const cs = Object.fromEntries(elements.flatMap(e => [e.fill, e.stroke]).filter((c): c is string => !!c).map((c, i) => [c, i]))
        const es = elements.map(e => ToTikz[e.type]({
            ...e,
            fill: e.fill ? `col${cs[e.fill]}` : undefined,
            stroke: e.stroke ? `col${cs[e.stroke]}` : undefined,
        } as Element as any)).join('\n')

        return [
            Object.entries(cs).map(([c, i]) => `\\definecolor{col${i}}{HTML}{${c.replace('#', '')}}`).join('\n'),
            '\\begin{tikzpicture}[y=1pt, x=1pt]',
            '\\begin{scope}[yscale=-10, xscale=10]',
            es,
            '\\end{scope}',
            '\\end{tikzpicture}'
        ].join('\n')
    }


}

if (module === require.main) {
    const es = tikzsvg.fromSvg(emoji)
    const svg = tikzsvg.toSvg(es)
    const tikz = tikzsvg.toTikz(es)

    await Bun.write("output.svg", svgDoc(svg))
    await Bun.write("output.tex", tikzDoc(tikz))
}
