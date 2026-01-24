import { Book } from "../src/book"
import { avifBase64 } from './img'

export const en: Book = {
    lang: "en",
    color: "#FF5733",
    title: "test title",
    author: "test author",
    heroAvifBase64: avifBase64,
    pages: [{
        gradient: ["#FF5733", "#33FF57"],
        textBackground: "#FFFFFF",
        text: "This is a sample text in English for a page in the book.",
        emojis: ["😀", "🚀", "🌟", "📚", "🎉", "💡"],
        avifBase64
    },
    {
        gradient: ["#FF5733", "#33FF57"],
        textBackground: "#FFFFFF",
        text: `This is a sample text in English for a page in the book.
        
    It contains multiple lines to test the formatting of the text within the LaTeX document.`,
        emojis: ["😀", "🚀", "🌟", "📚", "🎉", "💡"],
        avifBase64
    }]
}