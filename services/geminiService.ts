import { Composition, NoteEvent, PartType } from "../types";
import { MIDI, API, PIANO_ROLL } from "../constants";

// Use local proxy to keep API key secure on the server
const { PROXY_URL: API_PROXY_URL, TIMEOUT_MS: REQUEST_TIMEOUT_MS } = API;

// MIDI note range as specified in prompts
const { MIN_NOTE: MIN_MIDI_NOTE, MAX_NOTE: MAX_MIDI_NOTE, MIN_VELOCITY, MAX_VELOCITY } = MIDI;

// Counter for generating unique note IDs
let noteIdCounter = 0;

/**
 * Generates a unique ID for a note.
 */
const generateNoteId = (): string => {
  noteIdCounter += 1;
  return `note-${Date.now()}-${noteIdCounter}`;
};

/**
 * Strips markdown code block formatting from a string if present.
 */
const stripMarkdownCodeBlock = (text: string): string => {
  const trimmed = text.trim();
  const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = trimmed.match(codeBlockRegex);
  if (match) {
    return match[1].trim();
  }
  return trimmed;
};

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

const PART_DESCRIPTIONS: Record<PartType, string> = {
  melody: "a melodic line that complements the existing notes. The melody should be in a higher register (MIDI notes 60-84) and feature single notes with interesting intervals and phrasing.",
  chords: "a chord progression that harmonizes with the existing notes. Use chords (3-4 notes played simultaneously with the same startTime) in the middle register (MIDI notes 48-72).",
  bass: "a bass line that provides a foundation for the existing notes. The bass should be in a lower register (MIDI notes 28-48) with notes that outline the harmonic structure.",
};

/**
 * Validates and clamps note values to valid MIDI ranges.
 * Generates a unique ID for each note.
 */
const validateNote = (n: Partial<NoteEvent>): NoteEvent => {
  if (typeof n.note !== 'number' || typeof n.velocity !== 'number' ||
      typeof n.duration !== 'number' || typeof n.startTime !== 'number') {
    throw new Error('Invalid note structure: missing required fields');
  }
  return {
    id: generateNoteId(),
    note: Math.max(MIN_MIDI_NOTE, Math.min(MAX_MIDI_NOTE, Math.round(n.note))),
    velocity: Math.max(MIN_VELOCITY, Math.min(MAX_VELOCITY, Math.round(n.velocity))),
    duration: Math.max(0.01, n.duration),
    startTime: Math.max(0, n.startTime),
  };
};

/**
 * Validates that parsed JSON matches the expected Composition structure.
 */
const validateComposition = (data: unknown): Composition => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== 'string' || !obj.title.trim()) {
    throw new Error('Invalid response: missing or invalid "title"');
  }

  if (typeof obj.bpm !== 'number' || obj.bpm <= 0 || obj.bpm > 300) {
    throw new Error('Invalid response: "bpm" must be a number between 1 and 300');
  }

  if (!Array.isArray(obj.notes)) {
    throw new Error('Invalid response: "notes" must be an array');
  }

  return {
    title: obj.title.trim(),
    bpm: obj.bpm,
    notes: obj.notes.map((n, i) => {
      try {
        return validateNote(n as Partial<NoteEvent>);
      } catch (e) {
        throw new Error(`Invalid note at index ${i}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    }),
  };
};

/**
 * Validates that parsed JSON contains a valid notes array.
 */
const validateNotesArray = (data: unknown): NoteEvent[] => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.notes)) {
    throw new Error('Invalid response: "notes" must be an array');
  }

  return obj.notes.map((n, i) => {
    try {
      return validateNote(n as Partial<NoteEvent>);
    } catch (e) {
      throw new Error(`Invalid note at index ${i}: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  });
};

/**
 * Makes an API request with timeout support.
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Shared API call logic for both generate and addPart functions.
 */
const makeApiRequest = async (
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> => {
  if (!modelId) {
    throw new Error("Missing model selection. Choose a model from models.txt.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // If external signal is provided, abort when it aborts
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(API_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Try to parse error message from response
      try {
        const errorJson = JSON.parse(body);
        if (errorJson.error) {
          throw new Error(typeof errorJson.error === 'string' ? errorJson.error : errorJson.error.message || 'API request failed');
        }
      } catch {
        // Not JSON, use raw body
      }
      throw new Error(
        `API request failed (${res.status} ${res.statusText})${body ? `: ${body.slice(0, 200)}` : ''}`
      );
    }

    const json = (await res.json()) as OpenAIChatCompletionResponse;

    if (json.error) {
      throw new Error(json.error.message || 'API returned an error');
    }

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from API.");
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const GENERATE_SYSTEM_PROMPT =
  'Act as an expert music composer and MIDI expert. Output strictly valid JSON with the shape: {"title": string, "bpm": number, "notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}. Follow these rules: 1) "notes" must contain MIDI note numbers (21-108). 2) "duration" and "startTime" are in musical beats (float). 3) "velocity" is 0-127. 4) Suggest a BPM suitable for the style. 5) Ensure notes are sorted by startTime. Do not include any extra keys or any non-JSON text.';

const ADD_PART_SYSTEM_PROMPT =
  'Act as an expert music composer and MIDI expert. You will be given existing notes from a composition, and you must add NEW notes to complement them. Output strictly valid JSON with the shape: {"notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}. Follow these rules: 1) "notes" must contain MIDI note numbers (21-108). 2) "duration" and "startTime" are in musical beats (float). 3) "velocity" is 0-127. 4) Only output the NEW notes to be added, not the existing ones. 5) Ensure notes are sorted by startTime. Do not include any extra keys or any non-JSON text.';

export const generateMusic = async (
  prompt: string,
  modelId: string,
  signal?: AbortSignal
): Promise<Composition> => {
  const userPrompt = `Create a musical sequence based on this user request: "${prompt}".`;

  const content = await makeApiRequest(modelId, GENERATE_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);
    return validateComposition(data);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse music data: invalid JSON response from AI.");
    }
    throw e;
  }
};

export const addMusicPart = async (
  existingComposition: Composition,
  partType: PartType,
  modelId: string,
  signal?: AbortSignal
): Promise<Composition> => {
  const partDescription = PART_DESCRIPTIONS[partType];

  // Handle empty notes array safely
  const maxEndTime = existingComposition.notes.length > 0
    ? Math.max(...existingComposition.notes.map((n) => n.startTime + n.duration))
    : PIANO_ROLL.DEFAULT_DURATION; // Default to 8 beats if no notes

  const userPrompt = `Here is an existing composition titled "${existingComposition.title}" at ${existingComposition.bpm} BPM with a duration of approximately ${maxEndTime.toFixed(1)} beats.

Existing notes (JSON):
${JSON.stringify(existingComposition.notes, null, 2)}

Please add ${partDescription}

The new notes should span a similar duration (approximately ${maxEndTime.toFixed(1)} beats) and fit musically with the existing notes. Return ONLY the new notes to be added in JSON format.`;

  const content = await makeApiRequest(modelId, ADD_PART_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);
    const newNotes = validateNotesArray(data);

    // Combine existing notes with new notes and sort by startTime
    const allNotes = [...existingComposition.notes, ...newNotes].sort(
      (a, b) => a.startTime - b.startTime
    );

    return {
      ...existingComposition,
      notes: allNotes,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse music data: invalid JSON response from AI.");
    }
    throw e;
  }
};
