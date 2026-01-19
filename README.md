# tikzsvg

Generate beautiful PDF books with emoji SVG overlays and custom backgrounds using XeLaTeX and TikZ.

## Features

- 📚 Create multi-page PDF books from JSON input
- 🎨 Gradient backgrounds with customizable colors
- 🖼️ Embed images with custom shaped clipping paths
- ✨ SVG emoji overlays with precise positioning, scaling, and rotation
- 🌐 RTL (right-to-left) and LTR (left-to-right) text support
- 🔤 Hebrew text support with Fredoka-Bold font
- 📄 A5 paper format with page numbering

## Prerequisites

- [Bun](https://bun.sh) runtime
- XeLaTeX (from TeX Live or similar distribution)
- `Fredoka-Bold.ttf` font file in the project root

## Installation

```bash
bun install
```

## Usage

### Server Mode

Start the HTTP server:

```bash
bun --hot src/server.ts
```

Send a POST request with JSON book data:

```bash
curl http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d @book.json \
  -o output.pdf
```

### Book JSON Format

```json
{
  "dir": "rtl",
  "pages": [
    {
      "gradient": ["#8B4513", "#FFD1E0"],
      "textBg": "#FFF3E6",
      "text": [
        "Line 1 of text",
        "Line 2 of text"
      ],
      "emojis": {
        "text": [
          {
            "x": 10,
            "y": 20,
            "scale": 1.8,
            "rotate": -15,
            "emoji": "🍄"
          }
        ],
        "image": [
          {
            "x": -170,
            "y": -130,
            "scale": 1.8,
            "rotate": -15,
            "emoji": "🌺"
          }
        ]
      },
      "jpgBase64": "base64-encoded-image-data"
    }
  ]
}
```

## API Reference

### Book Schema

- `dir`: Text direction (`"rtl"` or `"ltr"`)
- `pages`: Array of page objects

### Page Schema

- `gradient`: Array of two hex colors for background gradient
- `textBg`: Hex color for text background overlay
- `text`: Array of text lines to display
- `emojis.text`: Emoji overlays for text pages
- `emojis.image`: Emoji overlays for image pages
- `jpgBase64`: Base64-encoded JPEG image (max 256KB)

### Emoji Schema

- `x`, `y`: Position coordinates in points
- `scale`: Scale factor
- `rotate`: Rotation angle in degrees
- `emoji`: Unicode emoji character

## How It Works

1. Receives book JSON via HTTP POST
2. Parses and validates input using Zod schemas
3. Converts emoji to SVG paths using pre-defined emoji map
4. Generates XeLaTeX document with TikZ graphics
5. Runs XeLaTeX twice to resolve coordinate references
6. Returns compiled PDF

## Development

The project uses:
- **Bun** for runtime and package management
- **TypeScript** for type safety
- **Zod** for schema validation
- **SAX** for SVG parsing
- **p-queue** for sequential PDF generation

## License

MIT
