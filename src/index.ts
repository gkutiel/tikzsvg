export namespace tikzsvg {
    export interface Common {
        fill: string
        stroke: string
        strokeWidth: number
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

    type To = {
        [t in types]: (args: Extract<Element, { type: t }>) => string
    }

    const ToSvg: To = {
        circle: ({ cx, cy, r, fill, stroke, strokeWidth }) =>
            `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`,

        path: ({ d, fill, stroke, strokeWidth }) =>
            `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`,
    }

    export function toSvg(elements: Element[]): string {
        return elements.map(e => ToSvg[e.type](e as any)).join('')
    }

    const ToTikz: To = {
        circle: ({ cx, cy, r, fill, stroke, strokeWidth }) =>
            `\\draw [fill=${fill}, draw=${stroke}, line width=${strokeWidth}pt] (${cx}, ${cy}) circle (${r});`,

        path: ({ d, fill, stroke, strokeWidth }) =>
            `\\draw [fill=${fill}, draw=${stroke}, line width=${strokeWidth}pt] svg {${d}};`,
    }

    export function toTikz(elements: Element[]): string {
        return elements.map(e => ToTikz[e.type](e as any)).join('\n')
    }

}
if (module === require.main) {
    const es: tikzsvg.Element[] = [
        {
            type: "circle",
            cx: 50,
            cy: 50,
            r: 40,
            fill: "blue",
            stroke: "black",
            strokeWidth: 2,
        },
        {
            type: "path",
            d: "M10 10 H 90 V 90 H 10 Z",
            fill: "none",
            stroke: "blue",
            strokeWidth: 1,
        }
    ]

    const svg = tikzsvg.toSvg(es)
    const tikz = tikzsvg.toTikz(es)

    await Bun.write("output.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${svg}</svg>`)
    await Bun.write("output.tex", `\\documentclass{standalone}
\\usepackage{tikz}
\\usetikzlibrary{svg.path}
\\begin{document}
\\begin{tikzpicture}[y=1pt, x=1pt]
    \\begin{scope}[yscale=-1]
        ${tikz}
    \\end{scope}
\\end{tikzpicture}
\\end{document}`)
}
