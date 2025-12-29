# AI MIDI Composer

Generate musical ideas with AI, preview them in a piano roll or drum lane view, play back in the browser, and export as MIDI. Supports both melodic compositions and drum patterns.

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

### Drum Composition
- **AI drum generation** — Describe the drum pattern you want (e.g., "funky disco groove", "heavy rock beat")
- **Lane-based timeline** — DAW-style drum editor with 9 drum pieces (kick, snare, clap, hi-hats, toms, crash, ride)
- **Click-to-edit** — Add or remove hits by clicking on the grid
- **Velocity control** — Full 0-127 velocity with opacity-based visualization
- **Synthesized drums** — Real-time playback using Tone.js drum synthesizers
- **MIDI import/export** — Upload existing drum MIDI files or export your patterns
- **Drum variations** — Generate A/B/C variations to compare different grooves

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

### Drum Patterns
1. Navigate to the **Drums** page using the nav bar
2. Enter a prompt describing your drum pattern (e.g., "four on the floor house beat")
3. Click **Generate Drums** to create the pattern
4. Edit hits by clicking cells in the drum lane view
5. Use **Variations** to generate alternative patterns
6. Export as MIDI using the download button

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
├── App.tsx                      # Router wrapper, model selection, navigation
├── types.ts                     # TypeScript types (NoteEvent, Composition, PartType, BarCount)
├── types/
│   └── drums.ts                 # Drum types (DrumHit, DrumPattern, DrumPiece)
├── constants.ts                 # MIDI, audio, generation, and drum constants
│
├── hooks/
│   ├── usePlayback.ts           # Tone.js synth, transport, play/stop logic
│   ├── useComposition.ts        # Composition state, all generation operations
│   ├── useDrumPlayback.ts       # Drum-specific playback with drum kit synths
│   └── useDrumComposition.ts    # Drum pattern state and generation
│
├── components/
│   ├── NavBar.tsx               # Navigation between Melodic and Drums pages
│   ├── MelodicPage.tsx          # Main melodic composition page
│   ├── PromptInput.tsx          # Text input + generate button + length control
│   ├── CompositionCard.tsx      # Title bar + piano roll + all control panels
│   ├── PianoRoll.tsx            # Note grid with part-based coloring + playhead
│   ├── PlayerControls.tsx       # Play/stop + download buttons
│   ├── AddPartButtons.tsx       # Add/regenerate melody/chords/bass
│   ├── LengthControl.tsx        # Bar count selector (4/8/16/32)
│   ├── StyleTransferPanel.tsx   # Style presets + custom input
│   ├── ContinuationPanel.tsx    # Extend composition controls
│   ├── VariationPicker.tsx      # Side-by-side variation comparison modal
│   │
│   └── drums/
│       ├── DrumPage.tsx         # Main drum composition page
│       ├── DrumPromptInput.tsx  # Drum prompt input + generate button
│       ├── DrumCompositionCard.tsx  # Drum pattern display + controls
│       ├── DrumLaneView.tsx     # Lane-based drum timeline editor
│       ├── DrumPlayerControls.tsx   # Play/stop + download for drums
│       └── DrumVariationPicker.tsx  # Drum variation comparison modal
│
├── services/
│   ├── geminiService.ts         # Melodic AI generation functions
│   ├── drumGeminiService.ts     # Drum AI generation functions
│   ├── midiEncoder.ts           # Melodic MIDI file encoder
│   ├── drumMidiEncoder.ts       # Drum MIDI encoder (GM channel 10)
│   ├── drumMidiImporter.ts      # Import drum patterns from MIDI files
│   ├── drumSynths.ts            # Drum synthesizer definitions (kick, snare, etc.)
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

9. **Drum Generation** — `drumGeminiService.generateDrumPattern()` prompts AI for drum hits → returns `{ title, bpm, hits[] }` with drum piece and time

10. **Drum Playback** — `useDrumPlayback` creates a drum kit (MembraneSynth for kick/toms, NoiseSynth for snare/clap, MetalSynth for cymbals) → triggers appropriate synths per hit

11. **Drum MIDI** — Uses General MIDI drum channel (10) with standard note mappings (kick=36, snare=38, etc.)

## Tech Stack

- **React 19** — UI framework
- **React Router** — Client-side routing
- **Vite** — Build tooling
- **Tone.js** — Web audio synthesis (loaded via CDN)
- **Tailwind CSS** — Styling (loaded via CDN)
- **OpenRouter** — LLM API gateway
- **TypeScript** — Type safety

## License

MIT
