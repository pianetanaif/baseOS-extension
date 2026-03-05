# BaseOS — Personal Chrome Extension

A minimal Chrome side panel extension for people who live in their browser.

Built for two things:
- **Save links** as you browse, with tags and notes, exportable to Obsidian
- **Quick todos** that live next to your browsing, for thoughts that can't wait

---

## Why

Most tools are built for an imaginary average user. This one is built for a specific brain — mine. The idea is that everyone should have tools that fit their own workflows, not the other way around.

This is also an experiment in *vibe coding*: building small, personal software quickly, dogfooding it, and improving it as you go.

---

## Features

**Link Saver**
- Auto-fills page title and meta description when you open the panel
- Add personal notes and free-form tags
- Filter saved links by tag
- Search across titles, summaries and notes
- Export everything as a `.md` file ready for Obsidian

**Todo List**
- Add tasks instantly while you browse
- Check off tasks — they grey out but stay visible
- Clear completed tasks when you're done

---

## Installation

This extension is not on the Chrome Web Store. Install it manually:

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `baseos-extension` folder

The BaseOS icon will appear in your toolbar. Click it to open the side panel.

---

## Usage

**Saving a link**
1. Browse to any page
2. Open the panel — title and description load automatically
3. Add notes and tags if you want
4. Press **Save Link** or hit `⌘S` / `Ctrl+S`

**Exporting to Obsidian**
1. Go to the **Links** tab
2. Click **export .md**
3. Move the downloaded file into your Obsidian vault

**Todos**
1. Go to the **Todo** tab
2. Type a task and press Enter or click `+`
3. Click the checkbox to mark done
4. Click **clear done** to remove completed tasks

---

## Stack

- Vanilla JS — no frameworks
- Chrome Extensions Manifest V3
- Chrome Storage API for persistence
- Geist / Geist Mono fonts

---

## Contributing

This started as a personal tool, but if it's useful to you — feel free to fork it, adapt it, improve it.

Pull requests are welcome. Keep things simple.

---

## License

MIT — see [LICENSE](LICENSE)
