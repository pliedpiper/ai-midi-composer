export interface NoteEvent {
  id: string;        // Unique identifier for React keys
  note: number;      // MIDI note number (21-108)
  velocity: number;  // 0-127
  duration: number;  // Duration in beats (e.g., 1.0 for quarter note)
  startTime: number; // Start time in beats
  partType?: PartType; // Track which part this note belongs to
}

export interface Composition {
  title: string;
  bpm: number;
  notes: NoteEvent[];
}

export type PartType = 'melody' | 'chords' | 'bass';

// Bar count options for length control
export type BarCount = 4 | 8 | 16 | 32;

// Composition variation for side-by-side comparison
export interface CompositionVariation {
  id: string;
  composition: Composition;
  label: string; // "A", "B", "C"
}

// Style preset for style transfer
export interface StylePreset {
  id: string;
  label: string;
  prompt: string;
}

// Audio filter parameter definition
export interface FilterParameter {
  name: string;       // Display name
  key: string;        // Parameter key for Tone.js
  min: number;        // Minimum value
  max: number;        // Maximum value
  default: number;    // Default value
  step: number;       // Slider step increment
  unit?: string;      // Optional unit label (e.g., 's', 'Hz', 'dB')
}

// Audio filter definition
export interface FilterDefinition {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  parameters: FilterParameter[];
}

// Runtime filter state
export interface FilterState {
  id: string;
  enabled: boolean;
  params: Record<string, number>;
}

// Instrument category for grouping
export type InstrumentCategory = 'keys' | 'synth' | 'other';

// Instrument definition
export interface InstrumentDefinition {
  id: string;
  name: string;
  description: string;
  category: InstrumentCategory;
}

// File System Access API permission mode
interface FileSystemPermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

// Tone.js and File System Access API type definitions
declare global {
  interface Window {
    Tone: unknown;
    showDirectoryPicker: (options?: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }

  // Extend FileSystemDirectoryHandle with permission methods
  interface FileSystemDirectoryHandle {
    queryPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
  }
}
