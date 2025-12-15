import { Composition, NoteEvent, PartType } from "../types";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Strips markdown code block formatting from a string if present.
 * Handles ```json, ```, and other common variations.
 */
const stripMarkdownCodeBlock = (text: string): string => {
  const trimmed = text.trim();
  // Match ```json or ``` at start, and ``` at end
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
};

const PART_DESCRIPTIONS: Record<PartType, string> = {
  melody: "a melodic line that complements the existing notes. The melody should be in a higher register (MIDI notes 60-84) and feature single notes with interesting intervals and phrasing.",
  chords: "a chord progression that harmonizes with the existing notes. Use chords (3-4 notes played simultaneously with the same startTime) in the middle register (MIDI notes 48-72).",
  bass: "a bass line that provides a foundation for the existing notes. The bass should be in a lower register (MIDI notes 28-48) with notes that outline the harmonic structure.",
};

export const generateMusic = async (prompt: string, modelId: string): Promise<Composition> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Set it in .env.local (see .env.example) and restart the dev server."
    );
  }
  if (!modelId) {
    throw new Error("Missing model selection. Choose a model from models.txt.");
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: "system",
          content:
            'Act as an expert music composer and MIDI expert. Output strictly valid JSON with the shape: {"title": string, "bpm": number, "notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}. Follow these rules: 1) "notes" must contain MIDI note numbers (21-108). 2) "duration" and "startTime" are in musical beats (float). 3) "velocity" is 0-127. 4) Suggest a BPM suitable for the style. 5) Ensure notes are sorted by startTime. Do not include any extra keys or any non-JSON text.',
        },
        {
          role: "user",
          content: `Create a musical sequence based on this user request: "${prompt}".`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter API request failed (${res.status} ${res.statusText}). Response body:\n${body || "<empty>"}`
    );
  }

  const json = (await res.json()) as OpenAIChatCompletionResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response content from OpenRouter.");

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent) as Composition;
    data.notes = data.notes.map((n) => ({
      ...n,
      note: Math.max(0, Math.min(127, n.note)),
      velocity: Math.max(0, Math.min(127, n.velocity)),
    }));
    return data;
  } catch (e) {
    console.error("JSON Parsing Error", e);
    throw new Error("Failed to parse music data from AI.");
  }
};

export const addMusicPart = async (
  existingComposition: Composition,
  partType: PartType,
  modelId: string
): Promise<Composition> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Set it in .env.local (see .env.example) and restart the dev server."
    );
  }
  if (!modelId) {
    throw new Error("Missing model selection. Choose a model from models.txt.");
  }

  const partDescription = PART_DESCRIPTIONS[partType];
  
  // Calculate the duration of the existing composition
  const maxEndTime = Math.max(
    ...existingComposition.notes.map((n) => n.startTime + n.duration)
  );

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: "system",
          content:
            'Act as an expert music composer and MIDI expert. You will be given existing notes from a composition, and you must add NEW notes to complement them. Output strictly valid JSON with the shape: {"notes": Array<{note:number, velocity:number, duration:number, startTime:number}>}. Follow these rules: 1) "notes" must contain MIDI note numbers (21-108). 2) "duration" and "startTime" are in musical beats (float). 3) "velocity" is 0-127. 4) Only output the NEW notes to be added, not the existing ones. 5) Ensure notes are sorted by startTime. Do not include any extra keys or any non-JSON text.',
        },
        {
          role: "user",
          content: `Here is an existing composition titled "${existingComposition.title}" at ${existingComposition.bpm} BPM with a duration of approximately ${maxEndTime.toFixed(1)} beats.

Existing notes (JSON):
${JSON.stringify(existingComposition.notes, null, 2)}

Please add ${partDescription}

The new notes should span a similar duration (approximately ${maxEndTime.toFixed(1)} beats) and fit musically with the existing notes. Return ONLY the new notes to be added in JSON format.`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter API request failed (${res.status} ${res.statusText}). Response body:\n${body || "<empty>"}`
    );
  }

  const json = (await res.json()) as OpenAIChatCompletionResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response content from OpenRouter.");

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent) as { notes: NoteEvent[] };
    const newNotes = data.notes.map((n) => ({
      ...n,
      note: Math.max(0, Math.min(127, n.note)),
      velocity: Math.max(0, Math.min(127, n.velocity)),
    }));

    // Combine existing notes with new notes and sort by startTime
    const allNotes = [...existingComposition.notes, ...newNotes].sort(
      (a, b) => a.startTime - b.startTime
    );

    return {
      ...existingComposition,
      notes: allNotes,
    };
  } catch (e) {
    console.error("JSON Parsing Error", e);
    throw new Error("Failed to parse music data from AI.");
  }
};
