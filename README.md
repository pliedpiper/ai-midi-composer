# AI MIDI Composer

Generate musical ideas with AI, preview them in a piano roll, play back in the browser, and export as MIDI.

<div align="center">
  <img width="1200" height="475" alt="AI MIDI Composer banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Features

- **Text-to-music generation** — Describe what you want, get a composition with `title`, `bpm`, and `notes`
- **Layered composition** — Add melody, chords, or bass parts to build on existing ideas
- **Live playback** — Hear your composition instantly with Tone.js synthesis
- **Piano roll visualization** — See notes in a scrolling grid with playhead tracking
- **MIDI export** — Download as a Standard MIDI File (Type 0)
- **Multi-model support** — Choose from any model in `models.txt` via OpenRouter

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
├── types.ts                     # TypeScript types (NoteEvent, Composition, PartType)
│
├── hooks/
│   ├── usePlayback.ts           # Tone.js synth, transport, play/stop logic
│   └── useComposition.ts        # Composition state, generate & addPart API calls
│
├── components/
│   ├── PromptInput.tsx          # Text input + generate button + error display
│   ├── CompositionCard.tsx      # Title bar + piano roll + add parts (container)
│   ├── PianoRoll.tsx            # Note grid visualization with playhead
│   ├── PlayerControls.tsx       # Play/stop + download buttons
│   └── AddPartButtons.tsx       # Melody/chords/bass layer buttons
│
├── services/
│   ├── geminiService.ts         # OpenRouter API calls for music generation
│   ├── midiEncoder.ts           # Pure JS MIDI file encoder (SMF Type 0)
│   └── models.ts                # Model list parsing from models.txt
│
└── models.txt                   # Allowed model IDs + optional display labels
```

## How It Works

1. **Generation** — User enters a prompt → `geminiService.generateMusic()` sends it to the selected LLM via OpenRouter → AI returns JSON with `{ title, bpm, notes[] }`

2. **Playback** — `usePlayback` hook initializes a Tone.js PolySynth → converts notes to Tone.Part events → schedules playback with automatic stop

3. **Adding Parts** — `geminiService.addMusicPart()` sends existing notes + part type to the AI → new notes are merged and sorted by `startTime`

4. **Export** — `midiEncoder.createMidiFile()` converts notes to binary MIDI format (SMF Type 0) → downloads as `.mid` file

## Tech Stack

- **React 19** — UI framework
- **Vite** — Build tooling
- **Tone.js** — Web audio synthesis (loaded via CDN)
- **Tailwind CSS** — Styling (loaded via CDN)
- **OpenRouter** — LLM API gateway
- **TypeScript** — Type safety

## License

MIT
