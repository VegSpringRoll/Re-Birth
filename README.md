# 🌌 ASTRAL ECHO // Full-Stack MERN Personal Roleplay Engine

An anime roleplay web application engineered with the MERN stack (**MongoDB, Express, React with Vite + Tailwind CSS, Node.js**), featuring multi-universe selection, dynamic world state tracking, tag-based dialogue & narration rendering, SillyTavern-style response swiping & editing, DuckDuckGo image avatar lookup, and BYOK (Bring Your Own Key) model routing.

---

## ⚡ Key Highlights & Architecture

### 1. 🔮 Realm Forge & Universal Selector (Enter ANY Anime, LN, Movie, or Series)
- **Preconfigured Popular Presets:**
  - **Jujutsu Kaisen** (Shibuya Incident / Special Grade Inverted Singularity)
  - **Solo Leveling** (Red Gate / Shadow Monarch Sovereign)
  - **Bleach** (Thousand-Year Blood War / Zero Branch Vanguard)
  - **Fate / Stay Night & Grand Order** (Fuyuki Holy Grail War / Saber & Gilgamesh)
  - **Cyberpunk: Edgerunners / 2077** (Night City / Sandevistan & Netrunning)
  - **Sousou no Frieren** (Northern Plateau / Elven Ancient Magic)
  - **Lord of the Mysteries** (Victorian Backlund Smog / Tarot Club Fool)
  - **Tensura** (Tempest Federation / Jura Forest)
- **Custom Universe Forge:**
  - Type **ANY** title: e.g. *Re:Zero*, *Chainsaw Man*, *Mushoku Tensei*, *Eminence in Shadow*, *Dune*, *Star Wars*, or original OC worlds.
  - Automatically initializes world state (universe, era, in-game date, location, weather, and starting NPCs), spins up initial opening turn, and fetches character avatars from DuckDuckGo into MongoDB.

### 2. 🎭 SillyTavern-Grade Turn Controls & Swipes
- **Multi-Swipe Alternative Candidates (`◀ 1 / 3 ▶`):**
  - Rerolling an assistant response saves it as a new candidate in `message.swipes` rather than overwriting it!
  - Switch between candidate responses with left/right arrows just like SillyTavern.
- **Prominent Turn Editing:**
  - Dedicated **Edit Last Turn** button right on the input toolbar.
  - Hover **Edit** button on every message with in-place expandable glass editor, formatting tags (`<narration>`, `<say>`), character count, and save.
- **Quick Actions:**
  - Quick syntax injection: `*Action*` and `"Dialogue"`.
  - Quick delete message turn with confirmation.
  - Quick copy raw message to clipboard.

### 3. 💎 3-Column Glassmorphic Desktop Layout
- **Left Panel (World, Timeline & Tracker):**
  - Live indicators for `Universe`, `Era`, `In-Game Date`, `Time of Day`, `Current Location`, and `Weather / Atmosphere`.
  - Active NPC Tracker with auto-fetched avatar thumbnails and relationship notes.
  - Collapsible Rolling Summary tab with automatic memory compaction (>12 turns down to 8).
- **Center Panel (The Roleplay Stage):**
  - Narration cards (`<narration>...`) with left violet border and italicized prose.
  - Dialogue speech bubbles (`<say speaker="...">...`) with official anime avatars, name badges, and quotation marks.
  - Real-time SSE token streaming without breaking layout or flashing XML tags.
  - Trailing `<state_update>` tags strictly isolated from chat feed and routed directly to MongoDB & Left Panel.
- **Right Drawer (Context, Moveset & Samplers):**
  - System prompt / director instructions editor.
  - Protagonist character sheet.
  - Martial techniques & weapons moveset with 1-click trigger injection buttons.
  - Precision sliders for `temperature` (0.0–2.0), `top_p` (0.0–1.0), and `frequency_penalty` (0.0–2.0).
  - BYOK Manager for OpenRouter, Anthropic, OpenAI, or Google Gemini keys stored strictly in `localStorage`.

---

## 🚀 Running the Web App

Both the Express backend and Vite client are active:
- **Vite Client:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **Unified Express Server (API + SPA):** [http://localhost:5000/](http://localhost:5000/)
