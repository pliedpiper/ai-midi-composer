# AI MIDI Composer

Generate a short musical idea with an LLM, preview it in a piano roll, play it back in the browser (Tone.js), and export it as a `.mid` file.

<div align="center">
  <img width="1200" height="475" alt="AI MIDI Composer banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Features

- Prompt → AI-generated composition (`title`, `bpm`, `notes`)
- Add parts to an existing idea: `melody`, `chords`, `bass`
- Playback with Tone.js + a simple piano roll visualization
- Export Standard MIDI File (Type 0)
- Model list + labels via `models.txt`

## Quickstart

**Prereqs:** Node.js 18+

1. Install:
   - `npm install`
2. Configure your OpenRouter key:
   - `cp .env.example .env.local`
   - Set `OPENROUTER_API_KEY=...` in `.env.local`
3. Run:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Model selection

Models are sourced from `models.txt` (one per line; blank lines and `#` comments are ignored).

Supported line formats:

- `provider/model-id`
- `provider/model-id,Human-readable name`

Ways to pick a model:

- In-app dropdown (persisted in `localStorage`)
- URL param (validated against `models.txt`):
  - `http://localhost:3000/?model=openai/gpt-5-mini`
  - `http://localhost:3000/?--model=openai/gpt-5-mini`

## Configuration notes (important)

- This is a front-end-only app: `OPENROUTER_API_KEY` is embedded into the client bundle at build time (see `vite.config.ts`).
- Treat the key as exposed to anyone who can load your app. For production, use a small backend/proxy so the browser never sees the API key.

## Scripts

- `npm run dev` — start Vite dev server (port `3000`)
- `npm run build` — build for production into `dist/`
- `npm run preview` — preview the production build locally

## Project layout

- `App.tsx` — UI + playback + export
- `services/geminiService.ts` — OpenRouter chat completions calls (JSON-only responses)
- `services/midiEncoder.ts` — minimal MIDI (SMF Type 0) encoder
- `components/PianoRoll.tsx` — piano roll renderer
- `models.txt` — allowed model IDs + optional display labels
