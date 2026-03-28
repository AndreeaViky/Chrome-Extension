# Blindful Extension

A Chrome extension for accessible web browsing through keyboard navigation and voice commands, built for visually impaired users.

---

## Installation

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top right corner).
3. Click **Load unpacked** and select the `app/` folder — the one that directly contains `manifest.json`.
4. The first time you use voice commands (`Ctrl+Z`), grant microphone permission when prompted.

> If you see the error `Could not load manifest`, you selected the wrong folder — go one level deeper in the folder structure.

---

## Usage

### Keyboard

| Key | Action |
|---|---|
| `Tab` | Next element (read aloud automatically) |
| `Shift + Tab` | Previous element |
| `Enter` | Activate the focused element |
| `Ctrl + Z` | Start / stop voice listening |

### Voice commands

Press `Ctrl+Z`, wait for the "Listening..." indicator in the bottom-right corner, then speak.

| Command | Effect |
|---|---|
| `"go to 5"` | Jump directly to element 5 |
| `"next"` / `"previous"` | Navigate forward / backward |
| `"click"` | Activate the current element |
| `"read page"` | Read the page title and main headings |
| `"scroll down"` / `"scroll up"` | Scroll the page |
| `"go to top"` | Jump to the top of the page |
| `"stop"` | Stop speaking |

