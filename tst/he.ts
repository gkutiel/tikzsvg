import { Book } from "../src/book"
import { avifBase64 } from './img'

export const he: Book = {
    lang: "he",
    color: "#FF5733",
    title: "בדיקה כותרת",
    author: "סופר בדיקה",
    heroAvifBase64: avifBase64,
    pages: [{
        gradient: ["#FF5733", "#33FF57"],
        textBackground: "#FFFFFF",
        text: "זהו טקסט לדוגמה בעברית לעמוד בספר.",
        emojis: ["😀", "🚀", "🌟", "📚", "🎉", "💡"],
        avifBase64
    },
    {
        gradient: ["#FF5733", "#33FF57"],
        textBackground: "#FFFFFF",
        text: "זהו טקסט לדוגמה בעברית לעמוד בספר.",
        emojis: ["😀", "🚀", "🌟", "📚", "🎉", "💡"],
        avifBase64
    }]
}