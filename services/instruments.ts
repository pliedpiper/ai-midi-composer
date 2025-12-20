import { InstrumentDefinition } from '../types';

// All instrument definitions
export const INSTRUMENT_DEFINITIONS: InstrumentDefinition[] = [
  // Keys
  {
    id: 'piano',
    name: 'Piano',
    description: 'Acoustic piano sound with natural decay',
    category: 'keys',
  },
  {
    id: 'electricPiano',
    name: 'Electric Piano',
    description: 'Rhodes-style FM electric piano',
    category: 'keys',
  },
  {
    id: 'organ',
    name: 'Organ',
    description: 'Classic organ with sustained tone',
    category: 'keys',
  },

  // Synths
  {
    id: 'synthLead',
    name: 'Synth Lead',
    description: 'Punchy lead synth for melodies',
    category: 'synth',
  },
  {
    id: 'synthPad',
    name: 'Synth Pad',
    description: 'Ambient pad with slow attack',
    category: 'synth',
  },
  {
    id: 'strings',
    name: 'Strings',
    description: 'Lush string ensemble sound',
    category: 'synth',
  },
  {
    id: 'bass',
    name: 'Bass',
    description: 'Deep synth bass',
    category: 'synth',
  },

  // Other
  {
    id: 'pluck',
    name: 'Pluck',
    description: 'Plucked string sound',
    category: 'other',
  },
  {
    id: 'bell',
    name: 'Bell',
    description: 'Crystalline bell tones',
    category: 'other',
  },
  {
    id: 'marimba',
    name: 'Marimba',
    description: 'Wooden mallet percussion',
    category: 'other',
  },
];

// Get instrument definition by ID
export const getInstrumentDefinition = (id: string): InstrumentDefinition | undefined => {
  return INSTRUMENT_DEFINITIONS.find(inst => inst.id === id);
};

// Default instrument
export const DEFAULT_INSTRUMENT_ID = 'piano';

// Type for synth instances that can trigger notes
export interface ToneSynthInstance {
  triggerAttackRelease: (
    note: string | string[],
    duration: number | string,
    time?: number,
    velocity?: number
  ) => void;
  connect: (node: unknown) => void;
  toDestination: () => void;
  disconnect: () => void;
  dispose: () => void;
}

// Create a Tone.js synth instance based on instrument ID
export const createInstrumentInstance = (
  instrumentId: string,
  Tone: Record<string, unknown>
): ToneSynthInstance | null => {
  try {
    switch (instrumentId) {
      case 'piano':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.Synth,
          {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
          }
        );

      case 'electricPiano':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.FMSynth,
          {
            harmonicity: 3.01,
            modulationIndex: 14,
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.8 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
          }
        );

      case 'organ':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.Synth,
          {
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.1 },
          }
        );

      case 'strings':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.Synth,
          {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 1.5 },
          }
        );

      case 'synthLead':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.Synth,
          {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
          }
        );

      case 'synthPad':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.Synth,
          {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 2 },
          }
        );

      case 'pluck':
        // PluckSynth uses Karplus-Strong synthesis
        return new (Tone.PluckSynth as new (options: unknown) => ToneSynthInstance)({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.98,
        });

      case 'bass':
        return new (Tone.MonoSynth as new (options: unknown) => ToneSynthInstance)({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 },
          filterEnvelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.5,
            release: 0.5,
            baseFrequency: 200,
            octaves: 2.5,
          },
        });

      case 'bell':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.FMSynth,
          {
            harmonicity: 8,
            modulationIndex: 2,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 2, sustain: 0, release: 2 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
          }
        );

      case 'marimba':
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.AMSynth,
          {
            harmonicity: 3.999,
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
          }
        );

      default:
        // Fallback to piano
        return new (Tone.PolySynth as new (synth: unknown, options: unknown) => ToneSynthInstance)(
          Tone.Synth,
          {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
          }
        );
    }
  } catch (e) {
    console.error(`Failed to create instrument ${instrumentId}:`, e);
    return null;
  }
};
