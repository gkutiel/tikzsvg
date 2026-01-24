import { Cover } from "../src/cover"
import { avifBase64 } from './img'

const blurb = `
This is sample text describing the book's content. The text can include information about the book's central theme, target audience, and the added value that readers will gain from reading it. You can also add details about the writing style, the overall structure of the book, and any additional information that can help readers understand what awaits them inside the book.

And also additional lines to expand the description and highlight important points.
`
export const en_cover: Cover = {
    lang: 'en',
    gradient: ['#FF5733', '#33FF57'],
    emoji: "🤲",
    title: "Sample Book Title",
    author: "Sample Author",
    tagline: "This is a sample tagline text",
    blurb,
    testimonial_quote: "This is a sample quote from a satisfied customer recommending the book.",
    testimonial_name: "Jane Smith",
    slogan: "This is a short and inviting slogan for the book.",
    avifBase64: avifBase64
}