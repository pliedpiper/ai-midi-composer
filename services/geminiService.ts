import { Composition, NoteEvent, PartType, BarCount, CompositionVariation } from "../types";
import { MIDI, API, PIANO_ROLL, GENERATION } from "../constants";

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
const validateNote = (n: Partial<NoteEvent>, partType?: PartType): NoteEvent => {
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
    ...(partType && { partType }),
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
const validateNotesArray = (data: unknown, partType?: PartType): NoteEvent[] => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.notes)) {
    throw new Error('Invalid response: "notes" must be an array');
  }

  return obj.notes.map((n, i) => {
    try {
      return validateNote(n as Partial<NoteEvent>, partType);
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

const REGENERATE_PART_SYSTEM_PROMPT =
  'Act as an expert music composer and MIDI expert. You are replacing a specific part (melody, chords, or bass) while keeping other parts intact. Generate notes that fit musically with the context provided. Output strictly valid JSON with the shape: {"notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}. Follow these rules: 1) "notes" must contain MIDI note numbers (21-108). 2) "duration" and "startTime" are in musical beats (float). 3) "velocity" is 0-127. 4) Only output the NEW notes for the specified part. 5) Ensure notes are sorted by startTime. Do not include any extra keys or any non-JSON text.';

const VARIATION_SYSTEM_PROMPT =
  'Act as an expert music composer. Generate multiple distinct variations of the given musical idea. Each variation should maintain the core musical identity while exploring different approaches. Output strictly valid JSON with the shape: {"variations": Array<{"notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}>}. Each variation should have different rhythmic patterns, melodic embellishments, or harmonic voicings while preserving the essence. Do not include any extra keys or any non-JSON text.';

const STYLE_TRANSFER_SYSTEM_PROMPT =
  'Act as an expert music composer specializing in style transformation. Transform the given notes to match the requested style while preserving the basic melodic/harmonic structure and duration. Output strictly valid JSON with the shape: {"notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}. The transformed notes should span the same duration as the original. Do not include any extra keys or any non-JSON text.';

const CONTINUATION_SYSTEM_PROMPT =
  'Act as an expert music composer. Extend the given composition naturally, maintaining musical coherence with the existing material. The continuation should follow the established style, key, and rhythmic patterns. Output strictly valid JSON with the shape: {"notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}. Ensure notes start from the specified beat and are sorted by startTime. Do not include any extra keys or any non-JSON text.';

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
    const newNotes = validateNotesArray(data, partType);

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

/**
 * Regenerates a specific part while keeping other parts intact.
 */
export const regeneratePart = async (
  existingComposition: Composition,
  partType: PartType,
  modelId: string,
  signal?: AbortSignal
): Promise<Composition> => {
  const partDescription = PART_DESCRIPTIONS[partType];

  // Filter out notes of the target partType
  const otherNotes = existingComposition.notes.filter(n => n.partType !== partType);

  // Calculate composition duration from all notes (before filtering)
  const maxEndTime = existingComposition.notes.length > 0
    ? Math.max(...existingComposition.notes.map(n => n.startTime + n.duration))
    : PIANO_ROLL.DEFAULT_DURATION;

  const userPrompt = `Here is an existing composition titled "${existingComposition.title}" at ${existingComposition.bpm} BPM.

Context notes (other parts to preserve):
${JSON.stringify(otherNotes, null, 2)}

Please regenerate the ${partType} part. ${partDescription}

The new notes should span approximately ${maxEndTime.toFixed(1)} beats and fit musically with the context notes. Return ONLY the new ${partType} notes in JSON format.`;

  const content = await makeApiRequest(modelId, REGENERATE_PART_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);
    const newNotes = validateNotesArray(data, partType);

    // Combine with other parts and sort
    const allNotes = [...otherNotes, ...newNotes].sort(
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

/**
 * Generates multiple variations of a composition for side-by-side comparison.
 */
export const generateVariations = async (
  existingComposition: Composition,
  count: 2 | 3,
  modelId: string,
  signal?: AbortSignal
): Promise<CompositionVariation[]> => {
  const userPrompt = `Create ${count} distinct variations of this composition:
Title: "${existingComposition.title}"
BPM: ${existingComposition.bpm}
Notes: ${JSON.stringify(existingComposition.notes, null, 2)}

Generate ${count} variations that maintain the musical essence but explore different:
- Rhythmic patterns
- Melodic embellishments
- Harmonic voicings

Each variation should be complete and playable on its own.`;

  const content = await makeApiRequest(modelId, VARIATION_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);

    if (!data.variations || !Array.isArray(data.variations)) {
      throw new Error('Invalid response: expected "variations" array');
    }

    return data.variations.slice(0, count).map((v: { notes: Partial<NoteEvent>[] }, i: number) => {
      if (!v.notes || !Array.isArray(v.notes)) {
        throw new Error(`Invalid variation at index ${i}: missing notes array`);
      }

      const validatedNotes = v.notes.map((n, j) => {
        try {
          // Preserve partType from original note if it exists at same position
          const originalNote = existingComposition.notes[j];
          return validateNote(n, originalNote?.partType);
        } catch (e) {
          throw new Error(`Invalid note at variation ${i}, index ${j}: ${e instanceof Error ? e.message : 'unknown error'}`);
        }
      });

      return {
        id: `variation-${Date.now()}-${i}`,
        composition: {
          ...existingComposition,
          title: `${existingComposition.title} (Variation ${String.fromCharCode(65 + i)})`,
          notes: validatedNotes,
        },
        label: String.fromCharCode(65 + i), // A, B, C
      };
    });
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse variations: invalid JSON response from AI.");
    }
    throw e;
  }
};

/**
 * Applies style transfer to transform a composition's style.
 */
export const applyStyleTransfer = async (
  existingComposition: Composition,
  stylePrompt: string,
  modelId: string,
  signal?: AbortSignal
): Promise<Composition> => {
  const maxEndTime = existingComposition.notes.length > 0
    ? Math.max(...existingComposition.notes.map(n => n.startTime + n.duration))
    : PIANO_ROLL.DEFAULT_DURATION;

  const userPrompt = `Transform this composition with the following style direction: "${stylePrompt}"

Original composition:
Title: "${existingComposition.title}"
BPM: ${existingComposition.bpm}
Duration: approximately ${maxEndTime.toFixed(1)} beats
Notes: ${JSON.stringify(existingComposition.notes, null, 2)}

Apply the style transformation while maintaining the overall structure and duration (approximately ${maxEndTime.toFixed(1)} beats).`;

  const content = await makeApiRequest(modelId, STYLE_TRANSFER_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);

    if (!data.notes || !Array.isArray(data.notes)) {
      throw new Error('Invalid response: expected "notes" array');
    }

    const transformedNotes = data.notes.map((n: Partial<NoteEvent>, i: number) => {
      try {
        // Try to preserve partType from original note at same position
        const originalNote = existingComposition.notes[i];
        return validateNote(n, originalNote?.partType);
      } catch (e) {
        throw new Error(`Invalid note at index ${i}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    });

    return {
      ...existingComposition,
      notes: transformedNotes,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse transformed music: invalid JSON response from AI.");
    }
    throw e;
  }
};

/**
 * Extends a composition by adding more bars.
 */
export const extendComposition = async (
  existingComposition: Composition,
  additionalBars: BarCount,
  modelId: string,
  signal?: AbortSignal
): Promise<Composition> => {
  const currentEndTime = existingComposition.notes.reduce(
    (max, n) => Math.max(max, n.startTime + n.duration),
    0
  );
  const additionalBeats = additionalBars * GENERATION.BEATS_PER_BAR;

  const userPrompt = `Continue this composition by adding ${additionalBars} more bars (${additionalBeats} beats).

Current composition ends at beat ${currentEndTime.toFixed(1)}:
Title: "${existingComposition.title}"
BPM: ${existingComposition.bpm}
Existing notes: ${JSON.stringify(existingComposition.notes, null, 2)}

Generate notes that start around beat ${currentEndTime.toFixed(1)} and extend for approximately ${additionalBeats} beats, maintaining musical continuity with the existing composition. Match the style, key, and rhythmic patterns of the original.`;

  const content = await makeApiRequest(modelId, CONTINUATION_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);

    if (!data.notes || !Array.isArray(data.notes)) {
      throw new Error('Invalid response: expected "notes" array');
    }

    const newNotes = data.notes.map((n: Partial<NoteEvent>, i: number) => {
      try {
        return validateNote(n);
      } catch (e) {
        throw new Error(`Invalid note at index ${i}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    });

    // Combine and sort all notes
    const allNotes = [...existingComposition.notes, ...newNotes].sort(
      (a, b) => a.startTime - b.startTime
    );

    return {
      ...existingComposition,
      notes: allNotes,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse continuation: invalid JSON response from AI.");
    }
    throw e;
  }
};

/**
 * Generates music with a specific length in bars.
 */
export const generateMusicWithLength = async (
  prompt: string,
  barCount: BarCount,
  modelId: string,
  signal?: AbortSignal
): Promise<Composition> => {
  const totalBeats = barCount * GENERATION.BEATS_PER_BAR;

  const enhancedPrompt = `Create a musical sequence based on this request: "${prompt}"

IMPORTANT: The composition should be exactly ${barCount} bars (${totalBeats} beats) in length. Ensure notes span from beat 0 to approximately beat ${totalBeats}.`;

  const content = await makeApiRequest(modelId, GENERATE_SYSTEM_PROMPT, enhancedPrompt, signal);

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
