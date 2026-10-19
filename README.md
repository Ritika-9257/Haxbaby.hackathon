# Pip's Dream World — Final Project

This is the consolidated static website project for **Pip — Junior Dream Engineer**. It includes the complete visual identity, original artwork, interactive storybook, toybox, nightlight whole-page themes, and the newly upgraded **Lullaby Lab with real playable audio** and **Interactive Storybook**.

---

## 🌟 Upgraded Features

### 1. The Lullaby Lab (`lullaby-lab.css`, `lullaby-lab.js`)
- **Real Playable Audio**: 4 genuine 44.1 kHz WAV audio tracks (no placeholder tones or silent controls):
  - *Starlight Music Box* (`assets/audio/lullaby-starlight.wav`, 33s) — Nostalgic celestial lullaby in 432 Hz tuning.
  - *Cradle in the Clouds* (`assets/audio/lullaby-cradle.wav`, 29s) — Tender celesta & harp arpeggio progression.
  - *Pip's Midnight Serenade* (`assets/audio/lullaby-midnight.wav`, 34s) — Classic Midnight Nursery bedtime hymn.
  - *Moonlit Slumber Waltz* (`assets/audio/lullaby-moonwaltz.wav`, 25s) — Soft 3/4 dream waltz dancing on cumulus clouds.
- **Controls & Interactions**:
  - Master Play/Pause, Next Track, Previous Track.
  - Scrub progress slider with live elapsed time and total duration.
  - Volume adjustment slider and Mute/Unmute button.
  - Continuous Repeat/Loop toggle.
  - Bedtime Sleep Timer (Off, 5, 15, 30, 45 mins) with live countdown badge and gentle volume fade-out over final 15 seconds.
  - Rocking cradle animation featuring Pip's music box illustration (`assets/pip-musicbox.webp`).
  - Active audio waveform visualizer bars synchronized with playback.
- **Ambient Soundscape Mixer**:
  - 3 layerable ambient sounds: **Starlight Rain** (`ambient-rain.wav`), **Night Wind** (`ambient-nightwind.wav`), and **Celestial Crickets** (`ambient-crickets.wav`).
  - Individual ON/OFF toggle pills and volume sliders to blend with any lullaby.
- **Custom Audio Import**:
  - `+ Add Custom Track` button allows loading any local `.mp3` or `.wav` file into the player.

### 2. The Interactive Storybook (`interactive-storybook.css`, `interactive-storybook.js`, `origin-story.js`)
- **5 Illustrated Chapters**:
  - Chapter 01: *The Nursery at Sleepy Sky*
  - Chapter 02: *The Star in the Cradle*
  - Chapter 03: *The Baby Who Could Hear Dreams*
  - Chapter 04: *Tiny Inventions, Big Comfort*
  - Chapter 05: *The Little Dream Engineer*
- **Clickable Scene Hotspots**:
  - 4 interactive pins per scene with pulsing rings, tooltips, and real sound effects (`sfx-chime.wav`, `sfx-pop.wav`, `sfx-pageturn.wav`, `sfx-giggle.wav`, `sfx-sparkle.wav`):
    - *Music box, wandering star, baby Pip, rocking cradle, dream bubbles, nightlight lantern, wise owl, and engineer's badge*.
- **Bedtime Decision Choices**:
  - Every chapter provides a meaningful decision that reveals a bedtime lore note box with audio and stardust feedback while preserving the authentic story.
- **Synchronized Bedtime Narration**:
  - Built-in Web Speech API narration with bedtime pacing (0.88x speed) and progressive sentence highlighting.
  - Quiet Reading Mode toggle for silent reading.
  - Keyboard shortcuts: `←` / `→` (Scene navigation), `Space` (Play/Pause narration), `R` (Replay scene).
- **Completion Certificate**:
  - Reaching Chapter 5 reveals the *Midnight Nursery Dream Certificate* with Pip's honorary Junior Dream Engineer badge!

### 3. Audio Coordination
- When storybook speech narration starts, Lullaby Lab volume automatically dips; starting a lullaby stops narration.
- Master sound toggle in the top-right header coordinates with all audio systems.

---

## 🚀 How to Run Locally

1. Open this folder in VS Code.
2. Start **Live Server** on `index.html` (recommended).
3. Or run from the command line:
   ```bash
   python -m http.server 8000
   ```
   and navigate to `http://localhost:8000`.

*No npm install or build step is required for this static package.*

---

## 📁 File Structure

- `index.html` — Site layout, sections, navigation, and dialogs.
- `styles.css` — Site styling, nightlight themes, layout.
- `lullaby-lab.css` & `lullaby-lab.js` — Lullaby Lab UI, audio engine, ambient mixer, and sleep timer.
- `interactive-storybook.css` & `interactive-storybook.js` — Hotspots, bedtime choices, speech narration, and completion certificate.
- `origin-story.css` & `origin-story.js` — 5-chapter story scroller and reader dialog.
- `gsap-effects.css` & `gsap-effects.js` — Particle effects, eye glints, and scroll transitions.
- `assets/` — Character artwork (`pip-main.webp`, `pip-musicbox.webp`, `pip-lantern.webp`, `pip-portrait.webp`).
- `assets/origin-story/` — 5 chapter illustrations (`pip-origin-01..05.webp`).
- `assets/audio/` — 12 WAV audio files (4 lullabies, 3 ambient loops, 5 sound effects).

---

## 🎵 Adding or Replacing Lullaby Audio

1. **Option 1 — Interactive UI**:
   - Scroll to **The Lullaby Lab**.
   - Click **"+ Add Custom Track"** and pick any `.mp3` or `.wav` from your device.
2. **Option 2 — Replace File**:
   - Place your replacement `.wav` or `.mp3` in `assets/audio/`.
   - Update `TRACKS` in `lullaby-lab.js`.
