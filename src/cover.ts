
import assert from "assert"
import { z } from "zod"
import { colorMap, defineColors, Emoji, fromSvg, getColors, svgTex, type Transform } from "./common"
import { emojiMap } from "./emojis"


export type Cover = z.infer<typeof Cover>
export const Cover = z.object({
    gradient: z.array(z.string()).length(2),
    emoji: Emoji,
    title: z.string().max(64),
    author: z.string().max(32),
    tagline: z.string().max(128),
    blurb: z.string().max(512),
    testimonial_quote: z.string().max(256),
    testimonial_name: z.string().max(64),
    slogan: z.string().max(64),
    jpgBase64: z.string().max(500_000),
})

const TRANSFORM: Transform = { x: -220, y: 60, scale: 2.3, rotate: -15 }
export function coverTex({
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

    return String.raw`
\documentclass[17pt]{extarticle}
\usepackage[a4paper, landscape, margin=0cm]{geometry}
\usepackage{setspace}
\usepackage{tikz}
\usetikzlibrary{svg.path}
\usetikzlibrary{calc}

\usepackage{polyglossia}
\setmainlanguage{hebrew}
% Ensure this file exists in your project folder!
\newfontfamily\hebrewfont[
Script=Hebrew,
Path=./,
Extension=.ttf,
UprightFont=*-Regular,
BoldFont=*-Bold
]{Fredoka}

\pagestyle{empty}

\begin{document}
${defineColors(colors)}

\begin{tikzpicture}[remember picture, overlay]
\shade [shading=axis, shading angle=45, left color=c${colors[c1]}, right color=c${colors[c2]}] 
(current page.south west) rectangle (current page.north east);

\fill[
yshift=-130,
xshift=-20,
xscale=410,
yscale=120,
blue!10, 
opacity=0.4] svg "M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05";

\fill[
white, 
opacity=0.2] 
($(current page.north east) + (-0.025\paperwidth, -1cm)$) 
rectangle ++(-0.45\paperwidth, -0.6\paperheight);
\end{tikzpicture}

\noindent
\begin{minipage}[c][0.95\textheight]{0.5\textwidth}
\centering
\begin{minipage}[t][0.6\textheight]{.8\textwidth}
\vspace{1cm}
\small
\textbf{${tagline}}

\vspace{.5cm}
\scriptsize
\begin{spacing}{1.5}
\setlength{\parskip}{.8em}
${blurb}
\end{spacing}
\vspace{\fill}

\vspace{0.5cm}
\footnotesize
\textbf{"${testimonial_quote}"}

\vspace{0.3cm}
\tiny
\hfill
- ${testimonial_name}
\end{minipage}
\vspace{\fill}
\begin{minipage}[c][0.25\textheight]{.8\textwidth}
\centering
\vspace{\fill}       
\begin{tikzpicture}
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

\vspace{\fill}       
\small
https://booky.kids

\vspace{0.2cm}
${slogan}

\end{minipage}
\end{minipage}
% 
% 
\begin{minipage}[c][0.95\textheight]{0.5\textwidth}
\begin{minipage}[c][0.25\textheight]{\textwidth}
\centering
\large
\textbf{${title}} \\[.1cm]
\small
${author}
\end{minipage}
\begin{minipage}[c][0.7\textheight]{\textwidth}
\centering
\begin{tikzpicture}
\begin{scope}
\clip[
yshift=-170,
xshift=-170,
scale=340] svg "M 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05 C 0.76 0.00 0.54 0.02 0.41 0.05 C 0.28 0.08 0.12 0.10 0.06 0.24 C 0.00 0.37 0.00 0.73 0.05 0.85 C 0.11 0.97 0.26 0.94 0.39 0.96 C 0.51 0.98 0.71 1.00 0.80 0.96 C 0.90 0.92 0.94 0.82 0.97 0.72 C 1.00 0.62 0.99 0.48 0.97 0.37 C 0.95 0.26 0.94 0.11 0.85 0.05";
\node[opacity=.75] at (0,0) {\includegraphics[width=12cm]{cover.jpg}};
\end{scope}
${svgTex(TRANSFORM, el, colors)}
\end{tikzpicture}
\end{minipage}
\end{minipage}

\end{document}
`
}

