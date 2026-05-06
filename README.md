# Instant Whiteboard

A slick, minimal Chrome whiteboard you can summon from anywhere.

## Features

- Toolbar icon click or `Cmd/Ctrl+Shift+W` to open in a new tab
- Infinite canvas with pan and pinch/scroll zoom
- Rectangle, ellipse, line, freehand pen, text
- Select / move / resize, eraser, undo / redo
- Auto-saves to `chrome.storage.local`
- Two-column floating toolbar, light theme, no clutter

## Stack

- Vite + `@crxjs/vite-plugin`
- React 19 + TypeScript (strict)
- Zustand for state, Konva for canvas, Lucide for icons

## Develop

```bash
npm install
npm run dev
```

Then load the `dist/` folder as an unpacked extension in `chrome://extensions`.

## Build

```bash
npm run build
```

## Hotkeys

| Key            | Action          |
| -------------- | --------------- |
| `V`            | Select          |
| `H`            | Pan (hand)      |
| `R`            | Rectangle       |
| `O`            | Ellipse         |
| `L`            | Line            |
| `P`            | Pen             |
| `T`            | Text            |
| `E`            | Eraser          |
| `⌘Z` / `Ctrl+Z`| Undo            |
| `⇧⌘Z` / `Ctrl+Y`| Redo           |
| `Backspace`    | Delete selected |
| `Esc`          | Deselect        |

## Icons (TODO)

Drop `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` into an `icons/` folder and re-add them to `manifest.json` to brand the extension.
