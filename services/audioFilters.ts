import { FilterDefinition, FilterState } from '../types';

// All 14 audio filter definitions
export const FILTER_DEFINITIONS: FilterDefinition[] = [
  {
    id: 'lofi',
    name: 'Lo-Fi',
    description: 'Vintage low-fidelity sound with reduced quality and warmth',
    defaultEnabled: false,
    parameters: [
      { name: 'Bits', key: 'bits', min: 1, max: 8, default: 4, step: 1 },
      { name: 'Filter Freq', key: 'frequency', min: 200, max: 2000, default: 800, step: 50, unit: 'Hz' },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 0.7, step: 0.05 },
    ],
  },
  {
    id: 'bitcrush',
    name: 'Bitcrush',
    description: '8-bit retro digital distortion',
    defaultEnabled: false,
    parameters: [
      { name: 'Bits', key: 'bits', min: 1, max: 16, default: 4, step: 1 },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 1, step: 0.05 },
    ],
  },
  {
    id: 'reverb',
    name: 'Reverb',
    description: 'Room ambience and space',
    defaultEnabled: true,
    parameters: [
      { name: 'Decay', key: 'decay', min: 0.1, max: 10, default: 2, step: 0.1, unit: 's' },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 0.5, step: 0.05 },
    ],
  },
  {
    id: 'delay',
    name: 'Delay',
    description: 'Echo effect with feedback',
    defaultEnabled: false,
    parameters: [
      { name: 'Time', key: 'delayTime', min: 0.01, max: 1, default: 0.25, step: 0.01, unit: 's' },
      { name: 'Feedback', key: 'feedback', min: 0, max: 0.9, default: 0.3, step: 0.05 },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 0.4, step: 0.05 },
    ],
  },
  {
    id: 'chorus',
    name: 'Chorus',
    description: 'Thickening effect with subtle detuning',
    defaultEnabled: false,
    parameters: [
      { name: 'Frequency', key: 'frequency', min: 0.1, max: 10, default: 1.5, step: 0.1, unit: 'Hz' },
      { name: 'Delay', key: 'delayTime', min: 2, max: 20, default: 3.5, step: 0.5, unit: 'ms' },
      { name: 'Depth', key: 'depth', min: 0, max: 1, default: 0.7, step: 0.05 },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 0.5, step: 0.05 },
    ],
  },
  {
    id: 'phaser',
    name: 'Phaser',
    description: 'Sweeping phase-shifted sound',
    defaultEnabled: false,
    parameters: [
      { name: 'Frequency', key: 'frequency', min: 0.1, max: 10, default: 0.5, step: 0.1, unit: 'Hz' },
      { name: 'Octaves', key: 'octaves', min: 1, max: 6, default: 3, step: 1 },
      { name: 'Base Freq', key: 'baseFrequency', min: 100, max: 1000, default: 350, step: 10, unit: 'Hz' },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 0.5, step: 0.05 },
    ],
  },
  {
    id: 'tremolo',
    name: 'Tremolo',
    description: 'Amplitude modulation for vintage vibe',
    defaultEnabled: false,
    parameters: [
      { name: 'Frequency', key: 'frequency', min: 0.1, max: 20, default: 4, step: 0.1, unit: 'Hz' },
      { name: 'Depth', key: 'depth', min: 0, max: 1, default: 0.5, step: 0.05 },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 1, step: 0.05 },
    ],
  },
  {
    id: 'vibrato',
    name: 'Vibrato',
    description: 'Pitch modulation for warmth',
    defaultEnabled: false,
    parameters: [
      { name: 'Frequency', key: 'frequency', min: 0.1, max: 20, default: 5, step: 0.1, unit: 'Hz' },
      { name: 'Depth', key: 'depth', min: 0, max: 1, default: 0.1, step: 0.01 },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 1, step: 0.05 },
    ],
  },
  {
    id: 'distortion',
    name: 'Distortion',
    description: 'Overdrive and saturation',
    defaultEnabled: false,
    parameters: [
      { name: 'Amount', key: 'distortion', min: 0, max: 1, default: 0.4, step: 0.05 },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 0.5, step: 0.05 },
    ],
  },
  {
    id: 'autowah',
    name: 'AutoWah',
    description: 'Envelope-following filter sweep',
    defaultEnabled: false,
    parameters: [
      { name: 'Base Freq', key: 'baseFrequency', min: 100, max: 800, default: 200, step: 10, unit: 'Hz' },
      { name: 'Octaves', key: 'octaves', min: 1, max: 8, default: 4, step: 1 },
      { name: 'Sensitivity', key: 'sensitivity', min: -40, max: 0, default: -20, step: 1, unit: 'dB' },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 1, step: 0.05 },
    ],
  },
  {
    id: 'eq3',
    name: 'EQ3',
    description: '3-band equalizer',
    defaultEnabled: false,
    parameters: [
      { name: 'Low', key: 'low', min: -24, max: 24, default: 0, step: 1, unit: 'dB' },
      { name: 'Mid', key: 'mid', min: -24, max: 24, default: 0, step: 1, unit: 'dB' },
      { name: 'High', key: 'high', min: -24, max: 24, default: 0, step: 1, unit: 'dB' },
    ],
  },
  {
    id: 'compressor',
    name: 'Compressor',
    description: 'Dynamic range compression',
    defaultEnabled: false,
    parameters: [
      { name: 'Threshold', key: 'threshold', min: -60, max: 0, default: -24, step: 1, unit: 'dB' },
      { name: 'Ratio', key: 'ratio', min: 1, max: 20, default: 4, step: 0.5 },
      { name: 'Attack', key: 'attack', min: 0.001, max: 0.5, default: 0.003, step: 0.001, unit: 's' },
      { name: 'Release', key: 'release', min: 0.01, max: 1, default: 0.25, step: 0.01, unit: 's' },
    ],
  },
  {
    id: 'stereoWidener',
    name: 'Stereo Widener',
    description: 'Enhance stereo image width',
    defaultEnabled: false,
    parameters: [
      { name: 'Width', key: 'width', min: 0, max: 1, default: 0.5, step: 0.05 },
    ],
  },
  {
    id: 'pingPongDelay',
    name: 'Ping Pong Delay',
    description: 'Alternating left-right echo',
    defaultEnabled: false,
    parameters: [
      { name: 'Time', key: 'delayTime', min: 0.05, max: 1, default: 0.25, step: 0.01, unit: 's' },
      { name: 'Feedback', key: 'feedback', min: 0, max: 0.9, default: 0.3, step: 0.05 },
      { name: 'Wet', key: 'wet', min: 0, max: 1, default: 0.4, step: 0.05 },
    ],
  },
];

// Get initial filter states from definitions
export const getInitialFilterStates = (): FilterState[] => {
  return FILTER_DEFINITIONS.map(def => ({
    id: def.id,
    enabled: def.defaultEnabled,
    params: def.parameters.reduce((acc, param) => {
      acc[param.key] = param.default;
      return acc;
    }, {} as Record<string, number>),
  }));
};

// Get a filter definition by ID
export const getFilterDefinition = (id: string): FilterDefinition | undefined => {
  return FILTER_DEFINITIONS.find(def => def.id === id);
};

// Type for Tone.js effect instances
export interface ToneEffectInstance {
  wet?: { value: number };
  connect: (node: ToneEffectInstance | { toDestination: () => void }) => void;
  toDestination: () => void;
  dispose: () => void;
}

// Create a Tone.js effect instance from filter state
// Note: Tone is loaded via CDN, so we access it from window
export const createEffectInstance = (
  filterState: FilterState,
  Tone: Record<string, unknown>
): ToneEffectInstance | null => {
  const def = getFilterDefinition(filterState.id);
  if (!def || !filterState.enabled) return null;

  const params = filterState.params;

  try {
    switch (filterState.id) {
      case 'lofi': {
        // Lo-Fi is a composite: BitCrusher with specific settings
        // We'll use BitCrusher with AutoFilter for the lo-fi sound
        const bitCrusher = new (Tone.BitCrusher as new (bits: number) => ToneEffectInstance)(
          params.bits
        );
        if (bitCrusher.wet) bitCrusher.wet.value = params.wet;
        return bitCrusher;
      }
      case 'bitcrush': {
        const effect = new (Tone.BitCrusher as new (bits: number) => ToneEffectInstance)(
          params.bits
        );
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'reverb': {
        const effect = new (Tone.Reverb as new (options: { decay: number }) => ToneEffectInstance)({
          decay: params.decay,
        });
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'delay': {
        const effect = new (Tone.FeedbackDelay as new (options: {
          delayTime: number;
          feedback: number;
        }) => ToneEffectInstance)({
          delayTime: params.delayTime,
          feedback: params.feedback,
        });
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'chorus': {
        const effect = new (Tone.Chorus as new (options: {
          frequency: number;
          delayTime: number;
          depth: number;
        }) => ToneEffectInstance)({
          frequency: params.frequency,
          delayTime: params.delayTime,
          depth: params.depth,
        });
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'phaser': {
        const effect = new (Tone.Phaser as new (options: {
          frequency: number;
          octaves: number;
          baseFrequency: number;
        }) => ToneEffectInstance)({
          frequency: params.frequency,
          octaves: params.octaves,
          baseFrequency: params.baseFrequency,
        });
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'tremolo': {
        const effect = new (Tone.Tremolo as new (options: {
          frequency: number;
          depth: number;
        }) => ToneEffectInstance)({
          frequency: params.frequency,
          depth: params.depth,
        });
        if (effect.wet) effect.wet.value = params.wet;
        // Tremolo needs to be started
        (effect as unknown as { start: () => void }).start();
        return effect;
      }
      case 'vibrato': {
        const effect = new (Tone.Vibrato as new (options: {
          frequency: number;
          depth: number;
        }) => ToneEffectInstance)({
          frequency: params.frequency,
          depth: params.depth,
        });
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'distortion': {
        const effect = new (Tone.Distortion as new (distortion: number) => ToneEffectInstance)(
          params.distortion
        );
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'autowah': {
        const effect = new (Tone.AutoWah as new (options: {
          baseFrequency: number;
          octaves: number;
          sensitivity: number;
        }) => ToneEffectInstance)({
          baseFrequency: params.baseFrequency,
          octaves: params.octaves,
          sensitivity: params.sensitivity,
        });
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      case 'eq3': {
        const effect = new (Tone.EQ3 as new (options: {
          low: number;
          mid: number;
          high: number;
        }) => ToneEffectInstance)({
          low: params.low,
          mid: params.mid,
          high: params.high,
        });
        return effect;
      }
      case 'compressor': {
        const effect = new (Tone.Compressor as new (options: {
          threshold: number;
          ratio: number;
          attack: number;
          release: number;
        }) => ToneEffectInstance)({
          threshold: params.threshold,
          ratio: params.ratio,
          attack: params.attack,
          release: params.release,
        });
        return effect;
      }
      case 'stereoWidener': {
        const effect = new (Tone.StereoWidener as new (width: number) => ToneEffectInstance)(
          params.width
        );
        return effect;
      }
      case 'pingPongDelay': {
        const effect = new (Tone.PingPongDelay as new (options: {
          delayTime: number;
          feedback: number;
        }) => ToneEffectInstance)({
          delayTime: params.delayTime,
          feedback: params.feedback,
        });
        if (effect.wet) effect.wet.value = params.wet;
        return effect;
      }
      default:
        return null;
    }
  } catch (e) {
    console.error(`Failed to create effect ${filterState.id}:`, e);
    return null;
  }
};
