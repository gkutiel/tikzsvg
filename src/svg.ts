import assert from "assert"
import type { Emoji } from "./common"
import { emojiMap } from "./emojis"

export function svg(emoji: Emoji) {
    assert(emoji in emojiMap, `Missing SVG for emoji: ${emoji}`)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">${emojiMap[emoji]}</svg>`
}

if (require.main === module) {
    console.log(svg("🌸"))
}