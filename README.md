# AI MIDI Composer

Generate musical ideas with AI, preview them in a piano roll, play back in the browser, and export as MIDI.

<div align="center">
  <img width="1200" height="475" alt="AI MIDI Composer banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Features

### Core
- **Text-to-music generation** — Describe what you want, get a composition with `title`, `bpm`, and `notes`
- **Layered composition** — Add melody, chords, or bass parts to build on existing ideas
- **Live playback** — Hear your composition instantly with Tone.js synthesis
- **Piano roll visualization** — See notes in a scrolling grid with playhead tracking and part-based coloring
- **MIDI export** — Download as a Standard MIDI File (Type 0)
- **Multi-model support** — Choose from any model in `models.txt` via OpenRouter

### AI Generation Features
- **Length control** — Specify exact bar count (4, 8, 16, or 32 bars) when generating
- **Regenerate parts** — Re-roll just the melody, chords, or bass without losing other parts
- **Variation generation** — Generate 2-3 variations and compare them side-by-side before choosing
- **Style transfer** — Transform your composition with style presets (Jazzy, Classical, Syncopated, etc.) or custom prompts
- **Continuation** — Extend your composition by adding more bars
- **Model switching** — Use different AI models for different parts of your composition

## Quickstart

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Configure OpenRouter API key
cp .env.example .env.local
# Edit .env.local and set OPENROUTER_API_KEY=sk-or-...

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

## Usage Guide

### Basic Generation
1. Enter a prompt describing the music you want (e.g., "upbeat jazz piano, 120 BPM")
2. Click the **Settings** (gear icon) to optionally set the bar count
3. Click **Generate** to create your composition

### Adding Parts
- Click **Melody**, **Chords**, or **Bass** to add that part
- Parts that already exist show a refresh icon — clicking regenerates just that part
- Each part is color-coded in the piano roll:
  - **Blue** — Melody
  - **Purple** — Chords
  - **Green** — Bass

### Variations
1. Click the **Shuffle** icon in the composition header
2. Compare 3 variations side-by-side in the modal
3. Preview each variation, then select your favorite

### Style Transfer
1. Expand the **Style Transfer** panel
2. Choose a preset (Jazzy, Classical, Syncopated, Minimalist, Dramatic)
3. Or enter a custom style prompt (e.g., "add swing rhythm", "make it more dramatic")

### Extending
1. Use the **Extend by** panel to select how many bars to add (4, 8, 16, or 32)
2. Click **Extend** to continue your composition

### Model Switching
- Change the model in the header dropdown at any time
- Each operation uses the currently selected model
- Generate with Gemini, add melody with GPT, add bass with Claude — all in one composition

## Model Selection

Models are defined in `models.txt` (one per line; blank lines and `#` comments ignored).

**Supported formats:**
```
provider/model-id
provider/model-id,Human-readable label
```

**Ways to select a model:**
- **Dropdown** — Select in the header (persisted to `localStorage`)
- **URL param** — `?model=google/gemini-2.0-flash-001` or `?--model=...`

## Configuration Notes

> ⚠️ **Security:** This is a frontend-only app. The `OPENROUTER_API_KEY` is embedded into the client bundle at build time (see `vite.config.ts`). Treat the key as exposed to anyone who can load your app. For production, use a backend proxy.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
├── App.tsx                      # Main app shell, model selection, layout
├── types.ts                     # TypeScript types (NoteEvent, Composition, PartType, BarCount)
├── constants.ts                 # MIDI, audio, and generation constants
│
├── hooks/
│   ├── usePlayback.ts           # Tone.js synth, transport, play/stop logic
│   └── useComposition.ts        # Composition state, all generation operations
│
├── components/
│   ├── PromptInput.tsx          # Text input + generate button + length control
│   ├── CompositionCard.tsx      # Title bar + piano roll + all control panels
│   ├── PianoRoll.tsx            # Note grid with part-based coloring + playhead
│   ├── PlayerControls.tsx       # Play/stop + download buttons
│   ├── AddPartButtons.tsx       # Add/regenerate melody/chords/bass
│   ├── LengthControl.tsx        # Bar count selector (4/8/16/32)
│   ├── StyleTransferPanel.tsx   # Style presets + custom input
│   ├── ContinuationPanel.tsx    # Extend composition controls
│   └── VariationPicker.tsx      # Side-by-side variation comparison modal
│
├── services/
│   ├── geminiService.ts         # All AI generation functions
│   ├── midiEncoder.ts           # Pure JS MIDI file encoder (SMF Type 0)
│   └── models.ts                # Model list parsing from models.txt
│
└── models.txt                   # Allowed model IDs + optional display labels
```

## How It Works

1. **Generation** — User enters a prompt → `geminiService.generateMusic()` sends it to the selected LLM via OpenRouter → AI returns JSON with `{ title, bpm, notes[] }`

2. **Part Tracking** — Each note stores a `partType` field (melody/chords/bass) so parts can be individually regenerated

3. **Playback** — `usePlayback` hook initializes a Tone.js PolySynth → converts notes to Tone.Part events → schedules playback with looping

4. **Adding/Regenerating Parts** — `addMusicPart()` merges new notes; `regeneratePart()` filters out the target part first, then generates fresh notes

5. **Variations** — `generateVariations()` asks the AI for multiple distinct versions → displayed in a comparison modal

6. **Style Transfer** — `applyStyleTransfer()` sends the composition with a style prompt → returns transformed notes

7. **Continuation** — `extendComposition()` calculates the current end time and asks the AI to continue from there

8. **Export** — `midiEncoder.createMidiFile()` converts notes to binary MIDI format (SMF Type 0) → downloads as `.mid` file

## Tech Stack

- **React 19** — UI framework
- **Vite** — Build tooling
- **Tone.js** — Web audio synthesis (loaded via CDN)
- **Tailwind CSS** — Styling (loaded via CDN)
- **OpenRouter** — LLM API gateway
- **TypeScript** — Type safety

## License

MIT
