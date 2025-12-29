import { DrumPiece } from '../types/drums';

// Type for a drum synth that can trigger sounds
export interface DrumSynthInstance {
  triggerAttackRelease: (
    noteOrDuration: number | string,
    durationOrTime?: number | string,
    timeOrVelocity?: number,
    velocity?: number
  ) => void;
  connect: (node: unknown) => void;
  toDestination: () => void;
  disconnect: () => void;
  dispose: () => void;
}

// Type for a membrane synth (for kicks and toms)
export interface MembraneSynthInstance {
  triggerAttackRelease: (
    note: string | number,
    duration: number | string,
    time?: number,
    velocity?: number
  ) => void;
  connect: (node: unknown) => void;
  toDestination: () => void;
  disconnect: () => void;
  dispose: () => void;
}

// A complete drum kit with all synths
export interface DrumKit {
  kick: MembraneSynthInstance;
  snare: {
    membrane: MembraneSynthInstance;
    noise: DrumSynthInstance;
  };
  clap: DrumSynthInstance;
  closedHiHat: DrumSynthInstance;
  openHiHat: DrumSynthInstance;
  crash: DrumSynthInstance;
  ride: DrumSynthInstance;
  highTom: MembraneSynthInstance;
  lowTom: MembraneSynthInstance;
}

// Drum piece pitch/frequency settings
const DRUM_SETTINGS = {
  kick: { pitch: 'C1', decay: 0.2 },
  snare: { pitch: 'E2', decay: 0.15, noiseDecay: 0.1 },
  clap: { decay: 0.08 },
  closedHiHat: { decay: 0.08, frequency: 400 },
  openHiHat: { decay: 0.3, frequency: 700 },
  crash: { decay: 1.5, frequency: 400 },
  ride: { decay: 0.8, frequency: 600 },
  highTom: { pitch: 'A2', decay: 0.2 },
  lowTom: { pitch: 'E2', decay: 0.25 },
};

// Create a complete drum kit
export const createDrumKit = (
  Tone: Record<string, unknown>
): DrumKit | null => {
  try {
    // Kick - deep membrane sound
    const kick = new (Tone.MembraneSynth as new (options: unknown) => MembraneSynthInstance)({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.kick.decay,
        sustain: 0,
        release: 0.1,
      },
    });

    // Snare - membrane + noise layered
    const snareMembrane = new (Tone.MembraneSynth as new (options: unknown) => MembraneSynthInstance)({
      pitchDecay: 0.01,
      octaves: 4,
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.snare.decay,
        sustain: 0,
        release: 0.05,
      },
    });

    const snareNoise = new (Tone.NoiseSynth as new (options: unknown) => DrumSynthInstance)({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.snare.noiseDecay,
        sustain: 0,
        release: 0.05,
      },
    });

    // Clap - noise with bandpass
    const clap = new (Tone.NoiseSynth as new (options: unknown) => DrumSynthInstance)({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.clap.decay,
        sustain: 0,
        release: 0.02,
      },
    });

    // Closed Hi-Hat - metallic short
    const closedHiHat = new (Tone.MetalSynth as new (options: unknown) => DrumSynthInstance)({
      frequency: DRUM_SETTINGS.closedHiHat.frequency,
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.closedHiHat.decay,
        release: 0.01,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: 6,
    });

    // Open Hi-Hat - metallic longer
    const openHiHat = new (Tone.MetalSynth as new (options: unknown) => DrumSynthInstance)({
      frequency: DRUM_SETTINGS.openHiHat.frequency,
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.openHiHat.decay,
        release: 0.1,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: 6,
    });

    // Crash - metallic long decay
    const crash = new (Tone.MetalSynth as new (options: unknown) => DrumSynthInstance)({
      frequency: DRUM_SETTINGS.crash.frequency,
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.crash.decay,
        release: 0.3,
      },
      harmonicity: 3.5,
      modulationIndex: 40,
      resonance: 3000,
      octaves: 2,
      volume: 6,
    });

    // Ride - metallic medium decay
    const ride = new (Tone.MetalSynth as new (options: unknown) => DrumSynthInstance)({
      frequency: DRUM_SETTINGS.ride.frequency,
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.ride.decay,
        release: 0.1,
      },
      harmonicity: 7,
      modulationIndex: 20,
      resonance: 5000,
      octaves: 1,
      volume: 6,
    });

    // High Tom - higher pitched membrane
    const highTom = new (Tone.MembraneSynth as new (options: unknown) => MembraneSynthInstance)({
      pitchDecay: 0.03,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.highTom.decay,
        sustain: 0,
        release: 0.1,
      },
    });

    // Low Tom - lower pitched membrane
    const lowTom = new (Tone.MembraneSynth as new (options: unknown) => MembraneSynthInstance)({
      pitchDecay: 0.03,
      octaves: 5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: DRUM_SETTINGS.lowTom.decay,
        sustain: 0,
        release: 0.1,
      },
    });

    return {
      kick,
      snare: { membrane: snareMembrane, noise: snareNoise },
      clap,
      closedHiHat,
      openHiHat,
      crash,
      ride,
      highTom,
      lowTom,
    };
  } catch (e) {
    console.error('Failed to create drum kit:', e);
    return null;
  }
};

const triggerMetalHit = (
  synth: DrumSynthInstance,
  frequency: number,
  duration: string,
  time: number,
  velocity: number
): void => {
  synth.triggerAttackRelease(frequency, duration, time, velocity);
};

// Trigger a specific drum piece
export const triggerDrumHit = (
  kit: DrumKit,
  drum: DrumPiece,
  time: number,
  velocity: number
): void => {
  // Normalize velocity from 0-127 to 0-1
  const vel = velocity / 127;

  switch (drum) {
    case 'kick':
      kit.kick.triggerAttackRelease(DRUM_SETTINGS.kick.pitch, '8n', time, vel);
      break;

    case 'snare':
      kit.snare.membrane.triggerAttackRelease(DRUM_SETTINGS.snare.pitch, '16n', time, vel);
      kit.snare.noise.triggerAttackRelease('16n', time, vel * 0.7);
      break;

    case 'clap':
      kit.clap.triggerAttackRelease('32n', time, vel);
      break;

    case 'closedHiHat':
      triggerMetalHit(
        kit.closedHiHat,
        DRUM_SETTINGS.closedHiHat.frequency,
        '16n',
        time,
        vel
      );
      break;

    case 'openHiHat':
      triggerMetalHit(
        kit.openHiHat,
        DRUM_SETTINGS.openHiHat.frequency,
        '8n',
        time,
        vel
      );
      break;

    case 'crash':
      triggerMetalHit(
        kit.crash,
        DRUM_SETTINGS.crash.frequency,
        '2n',
        time,
        vel
      );
      break;

    case 'ride':
      triggerMetalHit(
        kit.ride,
        DRUM_SETTINGS.ride.frequency,
        '4n',
        time,
        vel
      );
      break;

    case 'highTom':
      kit.highTom.triggerAttackRelease(DRUM_SETTINGS.highTom.pitch, '8n', time, vel);
      break;

    case 'lowTom':
      kit.lowTom.triggerAttackRelease(DRUM_SETTINGS.lowTom.pitch, '8n', time, vel);
      break;
  }
};

// Connect all drum synths to a destination node
export const connectDrumKit = (kit: DrumKit, destination: unknown): void => {
  kit.kick.connect(destination as never);
  kit.snare.membrane.connect(destination as never);
  kit.snare.noise.connect(destination as never);
  kit.clap.connect(destination as never);
  kit.closedHiHat.connect(destination as never);
  kit.openHiHat.connect(destination as never);
  kit.crash.connect(destination as never);
  kit.ride.connect(destination as never);
  kit.highTom.connect(destination as never);
  kit.lowTom.connect(destination as never);
};

// Disconnect all drum synths
export const disconnectDrumKit = (kit: DrumKit): void => {
  kit.kick.disconnect();
  kit.snare.membrane.disconnect();
  kit.snare.noise.disconnect();
  kit.clap.disconnect();
  kit.closedHiHat.disconnect();
  kit.openHiHat.disconnect();
  kit.crash.disconnect();
  kit.ride.disconnect();
  kit.highTom.disconnect();
  kit.lowTom.disconnect();
};

// Dispose all drum synths
export const disposeDrumKit = (kit: DrumKit): void => {
  kit.kick.dispose();
  kit.snare.membrane.dispose();
  kit.snare.noise.dispose();
  kit.clap.dispose();
  kit.closedHiHat.dispose();
  kit.openHiHat.dispose();
  kit.crash.dispose();
  kit.ride.dispose();
  kit.highTom.dispose();
  kit.lowTom.dispose();
};
