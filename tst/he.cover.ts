import { Cover } from "../src/cover"
import { avifBase64 } from './img'

const blurb = `
זהו טקסט לדוגמה המתאר את תוכן הספר. הטקסט יכול לכלול מידע על הנושא המרכזי של הספר, הקהל היעד, והערך המוסף שהקורא יקבל מקריאתו. ניתן להוסיף גם פרטים על הסגנון הכתיבה, המבנה הכללי של הספר, וכל מידע נוסף שיכול לעזור לקורא להבין מה מצפה לו בתוך הספר.

וגם שורות נוספות להרחבת התיאור ולהדגשת הנקודות החשובות.
`
export const he_cover: Cover = {
    lang: 'he',
    gradient: ['#FF5733', '#33FF57'],
    emoji: "🤲",
    title: "כותרת ספר לדוגמה",
    author: "סופר לדוגמה",
    tagline: "זהוא טקסט לדוגמה לקו תחתון",
    blurb,
    testimonial_quote: "זהו ציטוט לדוגמה מלקוח מרוצה שממליץ על הספר.",
    testimonial_name: "מירי רגב",
    slogan: "זהו סיסמא קצרה ומזמינה לספר.",
    avifBase64: avifBase64
}