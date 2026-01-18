interface Page {
    gradient: [string, string]
}

interface Book {
    pages: Page[]
}

function colorMap(colors: Set<string>) {
    return Object.fromEntries(Array.from(colors).map((c, i) => [c, i]))
}

function toTex(book: Book) {
    const colors = colorMap(new Set(book.pages.flatMap(p => p.gradient)))

    return String.raw`
\documentclass[a5paper, oneside]{article}
\usepackage[utf8]{inputenc}
\usepackage[
    left=0cm,
    right=0cm,
    top=0cm, 
    bottom=2cm
]{geometry}
\usepackage{tikz}
\usetikzlibrary{svg.path}

${Object.entries(colors).map(([color, i]) => `\\definecolor{c${i}}{HTML}{${color.replace('#', '')}}`).join('\n')}

\begin{document}

\thispagestyle{empty}
\mbox{} 
\newpage

${book.pages.map((page, i) => {
        const [c1, c2] = page.gradient
        return String.raw`
    \begin{tikzpicture}[remember picture, overlay]
        \shade[shading=axis, bottom color=c${colors[c1]}, top color=c${colors[c2]}, shading angle=45] 
        (current page.south west) rectangle ([xshift=148.5mm]current page.north east);
    \end{tikzpicture}

    \vspace*{\fill}
    Page ${i + 2}
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
            { gradient: ['#8B4513', '#FFD1E0'] },
        ]
    }

    const tex = toTex(book)
    require('fs').writeFileSync('output.tex', tex)
}