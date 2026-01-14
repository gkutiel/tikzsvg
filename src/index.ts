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


// <svg
//   width="120"
//   height="120"
//   viewBox="0 0 120 120"
//   xmlns="http://www.w3.org/2000/svg"
// >
//   <circle
//     cx="60"
//     cy="60"
//     r="40"
//     fill="steelblue"
//     stroke="black"
//     stroke-width="2"
//   />
// </svg>

