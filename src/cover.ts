
import assert from "assert"
import { z } from "zod"
import { absolute, background, bf, centering, colorMap, defineColors, Emoji, footnotesize, fromSvg, getColors, gradient, img, Lang, Large, minipage, normalsize, parskip, poly, quote, svg, tcolorbox, tikzpicture, txtBackground, vfill, vspace } from "./common"
import { emojiMap } from "./emojis"

const backBackground = String.raw`\fill[
white, 
opacity=0.2] 
($(current page.north east) + (-0.025\paperwidth, -1cm)$) 
rectangle ++(-0.45\paperwidth, -0.6\paperheight);
\end{tikzpicture}
`

const barcode = String.raw`\begin{tikzpicture}
% 1. Draw the white background rectangle with a thin border
\fill[white, opacity=0.8, rounded corners=2pt] (0,0) rectangle (4,2);

% 2. Generate "random" vertical lines for the barcode effect
% {position / thickness}
\foreach \x / \w in {
0.3/1.5, 0.5/0.5, 0.7/2.0, 0.9/0.8, 
1.2/1.2, 1.4/0.4, 1.6/2.5, 1.9/1.0, 
2.2/0.6, 2.4/1.8, 2.7/0.5, 3.0/2.2, 
3.3/0.9, 3.5/1.4, 3.7/0.7%
} {
\draw[line width=\w pt, black] (\x, 0.2) -- (\x, 1.8);
}
\end{tikzpicture} 
`

export type Cover = z.infer<typeof Cover>
export const Cover = z.object({
    lang: Lang,
    gradient: gradient,
    emoji: Emoji,
    title: z.string().max(64),
    author: z.string().max(32),
    tagline: z.string().max(128),
    blurb: z.string().max(512),
    testimonial_quote: z.string().max(256),
    testimonial_name: z.string().max(64),
    slogan: z.string().max(64),
    avifBase64: z.string().max(500_000),
})

export function coverTex({
    lang,
    gradient,
    emoji,
    title,
    author,
    tagline,
    blurb,
    testimonial_quote,
    testimonial_name,
    slogan
}: Cover) {

    const [c1, c2] = gradient
    assert(c1 && c2, "Gradient must have two colors")
    const el = fromSvg(emojiMap[emoji]!)
    const colors = colorMap(new Set([...gradient, ...el.flatMap(getColors)]))

    const rtl = lang === 'he'

    return String.raw`
\documentclass[17pt]{extarticle}
\usepackage[a4paper, landscape, margin=0cm]{geometry}
\usepackage{setspace}
\usepackage[most]{tcolorbox}

\usepackage{ragged2e}
\RaggedRight

\usepackage{tikz}
\usetikzlibrary{svg.path}
\usetikzlibrary{calc}

\setlength{\fboxsep}{0pt}
\setlength{\fboxrule}{.1pt}
${poly(lang)}
\pagestyle{empty}

\begin{document}
${defineColors(colors)}
\setlength{\parindent}{0pt}
\noindent
${[
            background({
                gradient,
                colors,
                tikz: [
                    txtBackground({
                        yshift: 155,
                        xshift: 10,
                        xscale: 410,
                        yscale: 120,
                        color: 'blue!10',
                        opacity: 0.4
                    }),
                ].join('\n')
            }),

            // TITLE
            minipage({
                vAlign: 't',
                width: .5,
                height: 1,
                content: [
                    minipage({
                        vAlign: 'c',
                        width: 1,
                        height: .28,
                        content: [
                            centering,
                            Large(bf(title)),
                            '',
                            vspace(0.5),
                            normalsize(author)
                        ].join('\n')
                    }),
                    '',
                    vfill,
                    centering,
                    tikzpicture([
                        img({ src: 'cover.jpg' }),
                    ].join('\n')),
                    vfill,
                ].join('\n')
            }),
            // BACK COVER
            minipage({
                vAlign: 't',
                width: .5,
                height: 1,
                content: [
                    centering,
                    vspace(1),
                    tcolorbox({
                        width: 0.9,
                        color: 'white',
                        opacity: 0.4,
                        arc: 5,
                        boxsep: .4,
                        halign: 'left',
                        content: minipage({
                            vAlign: 't',
                            width: 1,
                            height: .6,
                            content: [
                                parskip(0.3),
                                normalsize(bf(tagline)),
                                '',
                                vspace(0.3),
                                footnotesize(blurb),
                                '',
                                vfill,
                                quote({
                                    text: testimonial_quote,
                                    name: testimonial_name,
                                })
                            ].join('\n')
                        })
                    }),
                    '',
                    vfill,
                    barcode,
                    '',
                    'https://booky.kids',
                    '',
                    vspace(0.2),
                    footnotesize(slogan),
                    '',
                    vfill,
                ].join('\n')
            }),

            // EMOJI
            absolute([
                svg({
                    x: 10,
                    y: 220,
                    scale: 2.3,
                    rotate: -15,
                    colors,
                    elements: el,
                })
            ].join('\n')),
        ].join('\n')}

\end{document}
`
}

