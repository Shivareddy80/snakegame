# 🐍 Mini Snake Game

A fast, responsive, and sleek arcade Snake game built with modern web technologies (**HTML5 Canvas, CSS3, JavaScript**) and a standalone desktop edition in **Python (Tkinter)**.

Play instantly in your browser with zero setup, or launch the desktop version on your computer!

---

## ✨ Features

- 🎮 **Modern Arcade Aesthetics**: Neon retro dark-mode theme with smooth glowing graphics and rounded snake segments.
- 🔊 **8-Bit Procedural Audio**: Authentic retro arcade sound effects synthesized via the Web Audio API (no external audio files needed). Includes a mute toggle!
- 🍎 **Food Variety**:
  - **Standard Apples**: Red apples (+10 pts) that grow your snake.
  - **Golden Bonus Apples**: Rare glowing bonus fruit (+50 pts) with an animated circular countdown timer.
- 💥 **Particle Effects**: Dynamic particle bursts upon eating food and on game over.
- ⚡ **Dynamic Difficulty & Speed**: Choose between **Casual**, **Normal**, and **Insane** modes with gradual speed scaling as you score higher.
- 📱 **Mobile & Touch Friendly**: Supports touch swipe gestures and an on-screen virtual D-Pad for seamless mobile play.
- 💾 **Persistent High Scores**: Automatically records and persists your personal best in `localStorage`.
- 🐍 **Standalone Python Edition**: Includes `snake.py` built using standard Python `tkinter` (requires zero `pip install`).

---

## 🕹️ Controls

### Web Version
| Action | Key / Gesture |
| :--- | :--- |
| **Move Up** | <kbd>↑</kbd> or <kbd>W</kbd> / Swipe Up / D-Pad ▲ |
| **Move Down** | <kbd>↓</kbd> or <kbd>S</kbd> / Swipe Down / D-Pad ▼ |
| **Move Left** | <kbd>←</kbd> or <kbd>A</kbd> / Swipe Left / D-Pad ◀ |
| **Move Right** | <kbd>→</kbd> or <kbd>D</kbd> / Swipe Right / D-Pad ▶ |
| **Pause / Resume** | <kbd>Space</kbd> or Pause Button (⏸️) |
| **Restart Game** | <kbd>R</kbd> or Restart Button (🔄) |
| **Toggle Sound** | <kbd>M</kbd> or Mute Button (🔊) |

### Python Desktop Version
| Action | Key |
| :--- | :--- |
| **Move** | <kbd>Arrow Keys</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| **Pause / Resume** | <kbd>Space</kbd> |
| **Restart** | <kbd>R</kbd> |

---

## 🚀 Getting Started

### 1. Web Version (Instant Play)
Simply open `index.html` in any web browser:
- Double-click `index.html` in your file explorer, OR
- Serve with any local HTTP server:
  ```bash
  python -m http.server 8000
  ```
  Then visit `http://localhost:8000` in your browser.

#### GitHub Pages Deployment
1. Go to your repository on GitHub: `https://github.com/Shivareddy80/snakegame`
2. Navigate to **Settings** > **Pages**.
3. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
4. Your game will be live at `https://shivareddy80.github.io/snakegame/`!

### 2. Python Desktop Edition
Ensure you have Python 3 installed, then run:
```bash
python snake.py
```

---

## 📁 Project Structure

```text
snakegame/
├── index.html        # Main HTML entry point & UI structure
├── style.css         # Modern neon arcade theme & responsive layout
├── script.js         # Canvas engine, physics, sound synthesis & game loop
├── snake.py          # Standalone Python Tkinter desktop edition
├── .gitignore        # Git ignore rules
└── README.md         # Documentation & guide
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
