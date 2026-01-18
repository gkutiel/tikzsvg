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
\usepackage[margin=1.5cm]{geometry}
\usepackage{tikz}

% Define Pastel Colors
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

    Page ${i + 1}
    
    \newpage
    
    \begin{tikzpicture}[remember picture, overlay]
    \shade[shading=axis, bottom color=c${colors[c1]}, top color=c${colors[c2]}, shading angle=45] 
    ([xshift=-148.5mm]current page.south west) rectangle (current page.north east);
    \end{tikzpicture}
    
    Page ${i + 2}
    
    \newpage
`
    })}

\end{document}`
}

if (require.main === module) {
    const book: Book = {
        pages: [
            { gradient: ['#ADD8E6', '#FFB6C1'] },
        ]
    }

    const tex = toTex(book)
    require('fs').writeFileSync('output.tex', tex)
}