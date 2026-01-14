export namespace tikzsvg {
    export interface Circle {
        cx: number
        cy: number
        r: number
        fill: string
        stroke: string
        strokeWidth: number
    }

    export interface Element {
        height: number
        width: number
        kids: Circle[]
    }

    export function toSvg(element: Element): string {
        return `
            <svg
                width="${element.width}"
                height="${element.height}"
                viewBox="0 0 ${element.width} ${element.height}"
                xmlns="http://www.w3.org/2000/svg"
                >
                  ${element.kids.map(({ cx, cy, r, fill, stroke, strokeWidth }) =>
            `<circle
                cx="${cx}"
                cy="${cy}"
                r="${r}"
                fill="${fill}"
                stroke="${stroke}"
                stroke-width="${strokeWidth}"/>`)
                .join('').trim()}
            </svg>`
    }

    export function toTikz(element: Element): string {
        return `
            \\begin{tikzpicture}
                ${element.kids.map(({ cx, cy, r, fill, stroke, strokeWidth }) =>
            `\\draw[fill=${fill}, draw=${stroke}, line width=${strokeWidth}pt] (${cx}, ${cy}) circle (${r});`)
                .join('\n').trim()}
            \\end{tikzpicture}`
    }
}


if (module === require.main) {
    const elem: tikzsvg.Element = {
        width: 120,
        height: 120,
        kids: [
            {
                cx: 60,
                cy: 60,
                r: 40,
                fill: "blue",
                stroke: "black",
                strokeWidth: 2,
            },
        ],
    }

    await Bun.write("output.svg", tikzsvg.toSvg(elem))
    const tikz = tikzsvg.toTikz(elem)
    const tex = String.raw`
    \documentclass[tikz,border=0]{standalone}
    \usepackage{tikz}                        

    \begin{document}

    ${tikz}
    \end{document}

    `
    await Bun.write("output.tex", tex)
}