import { DrumPattern, DrumHit, DrumPiece, DrumPatternVariation } from '../types/drums';
import { BarCount } from '../types';
import { API, GENERATION, DRUM_PIECES } from '../constants';

const { PROXY_URL: API_PROXY_URL, TIMEOUT_MS: REQUEST_TIMEOUT_MS } = API;

// Counter for generating unique hit IDs
let hitIdCounter = 0;

const generateHitId = (): string => {
  hitIdCounter += 1;
  return `hit-${Date.now()}-${hitIdCounter}`;
};

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

// Valid drum piece names for validation
const VALID_DRUM_PIECES: DrumPiece[] = [
  'kick', 'snare', 'clap', 'closedHiHat', 'openHiHat',
  'crash', 'ride', 'highTom', 'lowTom'
];

const validateDrumPiece = (drum: unknown): DrumPiece => {
  if (typeof drum !== 'string' || !VALID_DRUM_PIECES.includes(drum as DrumPiece)) {
    throw new Error(`Invalid drum piece: ${drum}. Must be one of: ${VALID_DRUM_PIECES.join(', ')}`);
  }
  return drum as DrumPiece;
};

const validateHit = (h: Partial<DrumHit>): DrumHit => {
  if (typeof h.time !== 'number' || typeof h.velocity !== 'number') {
    throw new Error('Invalid hit structure: missing required fields');
  }

  return {
    id: generateHitId(),
    drum: validateDrumPiece(h.drum),
    time: Math.max(0, h.time),
    velocity: Math.max(0, Math.min(127, Math.round(h.velocity))),
  };
};

const validateDrumPattern = (data: unknown): DrumPattern => {
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

  if (!Array.isArray(obj.hits)) {
    throw new Error('Invalid response: "hits" must be an array');
  }

  return {
    title: obj.title.trim(),
    bpm: obj.bpm,
    hits: obj.hits.map((h, i) => {
      try {
        return validateHit(h as Partial<DrumHit>);
      } catch (e) {
        throw new Error(`Invalid hit at index ${i}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    }),
  };
};

const validateHitsArray = (data: unknown): DrumHit[] => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.hits)) {
    throw new Error('Invalid response: "hits" must be an array');
  }

  return obj.hits.map((h, i) => {
    try {
      return validateHit(h as Partial<DrumHit>);
    } catch (e) {
      throw new Error(`Invalid hit at index ${i}: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  });
};

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

// Build available drums string for prompts
const AVAILABLE_DRUMS = DRUM_PIECES.map(d => `- ${d.id} (${d.name})`).join('\n');

const DRUM_GENERATE_SYSTEM_PROMPT = `Act as an expert drum pattern composer. Output strictly valid JSON with the shape: {"title": string, "bpm": number, "hits": Array<{drum: string, time: number, velocity: number}>}.

Available drum pieces (use ONLY these exact names):
${AVAILABLE_DRUMS}

Rules:
1) "drum" must be one of the exact names listed above
2) "time" is in musical beats (float, e.g., 0, 0.25, 0.5, 0.75, 1, etc.)
3) "velocity" is 0-127 (use lower values 40-70 for ghost notes, 90-110 for normal, 110-127 for accents)
4) Create musical, groovy patterns appropriate for the requested style
5) Use varied velocities for dynamics
6) Include appropriate fills if described in the prompt
7) Suggest a BPM suitable for the style

Do not include any extra keys or any non-JSON text.`;

const DRUM_VARIATION_SYSTEM_PROMPT = `Act as an expert drum pattern composer. Generate multiple distinct variations of the given drum pattern. Each variation should maintain the core groove while exploring different approaches.

Available drum pieces (use ONLY these exact names):
${AVAILABLE_DRUMS}

Output strictly valid JSON with the shape: {"variations": Array<{"hits": Array<{drum: string, time: number, velocity: number}>}>}.

Each variation should have different:
- Hi-hat patterns (open vs closed, different subdivisions)
- Kick/snare placement variations
- Fill ideas
- Dynamic contours

While preserving the overall feel and tempo. Do not include any extra keys or any non-JSON text.`;

const DRUM_REGENERATE_SYSTEM_PROMPT = `Act as an expert drum pattern composer. Create a new variation of the given drum pattern that maintains the same feel but with fresh ideas.

Available drum pieces (use ONLY these exact names):
${AVAILABLE_DRUMS}

Output strictly valid JSON with the shape: {"title": string, "bpm": number, "hits": Array<{drum: string, time: number, velocity: number}>}.

The new pattern should:
1) Maintain the same duration and BPM
2) Keep a similar groove feel
3) Explore different rhythmic ideas
4) Use varied velocities for dynamics

Do not include any extra keys or any non-JSON text.`;

/**
 * Generates a new drum pattern from a text prompt.
 */
export const generateDrumPattern = async (
  prompt: string,
  barCount: BarCount,
  modelId: string,
  signal?: AbortSignal
): Promise<DrumPattern> => {
  const totalBeats = barCount * GENERATION.BEATS_PER_BAR;

  const userPrompt = `Create a drum pattern based on this request: "${prompt}"

The pattern should be exactly ${barCount} bars (${totalBeats} beats) long.
Time values should range from 0 to ${totalBeats - 0.25}.

Consider:
- Appropriate kick and snare placement for the style
- Hi-hat patterns (8th notes, 16th notes, or appropriate subdivision)
- Cymbal accents (crash on downbeats, ride for continuous patterns)
- Dynamics (ghost notes, accents)
- Any fills described in the prompt`;

  const content = await makeApiRequest(modelId, DRUM_GENERATE_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);
    return validateDrumPattern(data);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse drum pattern: invalid JSON response from AI.");
    }
    throw e;
  }
};

/**
 * Regenerates a drum pattern with context from the current pattern.
 * This is "context-aware" regeneration.
 */
export const regenerateDrumPattern = async (
  currentPattern: DrumPattern,
  prompt: string,
  modelId: string,
  signal?: AbortSignal
): Promise<DrumPattern> => {
  const maxTime = currentPattern.hits.reduce((max, h) => Math.max(max, h.time), 0);
  const barCount = Math.ceil((maxTime + 1) / GENERATION.BEATS_PER_BAR);
  const totalBeats = barCount * GENERATION.BEATS_PER_BAR;

  const userPrompt = `Create a new variation of this drum pattern.

Current pattern info:
- Title: "${currentPattern.title}"
- BPM: ${currentPattern.bpm}
- Duration: ${barCount} bars (${totalBeats} beats)

Current hits for reference:
${JSON.stringify(currentPattern.hits, null, 2)}

Original request: "${prompt}"

Generate a fresh pattern that:
1) Maintains the same BPM (${currentPattern.bpm}) and duration (${barCount} bars)
2) Keeps a similar overall feel but with new rhythmic ideas
3) Uses varied velocities for dynamics
4) Time values should range from 0 to ${totalBeats - 0.25}`;

  const content = await makeApiRequest(modelId, DRUM_REGENERATE_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);
    const pattern = validateDrumPattern(data);

    // Ensure BPM matches original
    return {
      ...pattern,
      bpm: currentPattern.bpm,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse drum pattern: invalid JSON response from AI.");
    }
    throw e;
  }
};

/**
 * Generates multiple variations of a drum pattern.
 */
export const generateDrumVariations = async (
  currentPattern: DrumPattern,
  count: 2 | 3,
  modelId: string,
  signal?: AbortSignal
): Promise<DrumPatternVariation[]> => {
  const maxTime = currentPattern.hits.reduce((max, h) => Math.max(max, h.time), 0);
  const barCount = Math.ceil((maxTime + 1) / GENERATION.BEATS_PER_BAR);
  const totalBeats = barCount * GENERATION.BEATS_PER_BAR;

  const userPrompt = `Create ${count} distinct variations of this drum pattern:

Current pattern:
- Title: "${currentPattern.title}"
- BPM: ${currentPattern.bpm}
- Duration: ${barCount} bars (${totalBeats} beats)

Current hits:
${JSON.stringify(currentPattern.hits, null, 2)}

Generate ${count} variations that each:
1) Maintain the same duration (${totalBeats} beats, time values 0 to ${totalBeats - 0.25})
2) Keep the core groove identifiable
3) Explore different rhythmic approaches
4) Use varied velocities for dynamics

Each variation should be distinctly different from the others.`;

  const content = await makeApiRequest(modelId, DRUM_VARIATION_SYSTEM_PROMPT, userPrompt, signal);

  try {
    const cleanedContent = stripMarkdownCodeBlock(content);
    const data = JSON.parse(cleanedContent);

    if (!data.variations || !Array.isArray(data.variations)) {
      throw new Error('Invalid response: expected "variations" array');
    }

    return data.variations.slice(0, count).map((v: { hits: Partial<DrumHit>[] }, i: number) => {
      if (!v.hits || !Array.isArray(v.hits)) {
        throw new Error(`Invalid variation at index ${i}: missing hits array`);
      }

      const validatedHits = v.hits.map((h, j) => {
        try {
          return validateHit(h);
        } catch (e) {
          throw new Error(`Invalid hit at variation ${i}, index ${j}: ${e instanceof Error ? e.message : 'unknown error'}`);
        }
      });

      return {
        id: `drum-variation-${Date.now()}-${i}`,
        pattern: {
          title: `${currentPattern.title} (Variation ${String.fromCharCode(65 + i)})`,
          bpm: currentPattern.bpm,
          hits: validatedHits,
        },
        label: String.fromCharCode(65 + i), // A, B, C
      };
    });
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Failed to parse drum variations: invalid JSON response from AI.");
    }
    throw e;
  }
};
