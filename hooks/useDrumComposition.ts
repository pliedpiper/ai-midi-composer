import { useState, useCallback, useRef } from 'react';
import { DrumPattern, DrumPatternVariation, DrumHit, DrumPiece } from '../types/drums';
import { BarCount } from '../types';
import {
  generateDrumPattern,
  regenerateDrumPattern,
  generateDrumVariations,
} from '../services/drumGeminiService';
import { DRUM_LANE } from '../constants';

// Counter for generating unique hit IDs
let hitIdCounter = 0;

const generateHitId = (): string => {
  hitIdCounter += 1;
  return `hit-${Date.now()}-${hitIdCounter}`;
};

interface UseDrumCompositionReturn {
  pattern: DrumPattern | null;
  loading: boolean;
  regenerating: boolean;
  generatingVariations: boolean;
  variations: DrumPatternVariation[] | null;
  error: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  generate: (prompt: string, modelId: string, barCount?: BarCount) => Promise<void>;
  regenerate: (modelId: string) => Promise<void>;
  generateVariations: (count: 2 | 3, modelId: string) => Promise<void>;
  selectVariation: (id: string) => void;
  clearVariations: () => void;
  setError: (error: string | null) => void;
  setPattern: (pattern: DrumPattern | null) => void;
  addHit: (drum: DrumPiece, time: number, velocity: number) => void;
  removeHit: (hitId: string) => void;
  updateHitVelocity: (hitId: string, velocity: number) => void;
  cancelRequest: () => void;
}

export const useDrumComposition = (): UseDrumCompositionReturn => {
  const [pattern, setPattern] = useState<DrumPattern | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [variations, setVariations] = useState<DrumPatternVariation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef<string>('');

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const isOperationInProgress = useCallback(() => {
    return loading || regenerating || generatingVariations;
  }, [loading, regenerating, generatingVariations]);

  const generate = useCallback(async (
    userPrompt: string,
    modelId: string,
    barCount: BarCount = 4
  ) => {
    if (isOperationInProgress()) return;
    if (!userPrompt.trim()) {
      setError('Please enter a prompt to generate a drum pattern.');
      return;
    }

    cancelRequest();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setVariations(null);
    lastPromptRef.current = userPrompt;

    try {
      const result = await generateDrumPattern(
        userPrompt,
        barCount,
        modelId,
        abortControllerRef.current.signal
      );
      setPattern(result);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to generate drum pattern');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [cancelRequest, isOperationInProgress]);

  const regenerate = useCallback(async (modelId: string) => {
    if (isOperationInProgress() || !pattern) return;

    cancelRequest();
    abortControllerRef.current = new AbortController();

    setRegenerating(true);
    setError(null);
    setVariations(null);

    try {
      const result = await regenerateDrumPattern(
        pattern,
        lastPromptRef.current || 'drum pattern',
        modelId,
        abortControllerRef.current.signal
      );
      setPattern(result);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to regenerate drum pattern');
    } finally {
      setRegenerating(false);
      abortControllerRef.current = null;
    }
  }, [pattern, cancelRequest, isOperationInProgress]);

  const handleGenerateVariations = useCallback(async (
    count: 2 | 3,
    modelId: string
  ) => {
    if (isOperationInProgress() || !pattern) return;

    cancelRequest();
    abortControllerRef.current = new AbortController();

    setGeneratingVariations(true);
    setError(null);

    try {
      const result = await generateDrumVariations(
        pattern,
        count,
        modelId,
        abortControllerRef.current.signal
      );
      setVariations(result);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to generate variations');
    } finally {
      setGeneratingVariations(false);
      abortControllerRef.current = null;
    }
  }, [pattern, cancelRequest, isOperationInProgress]);

  const selectVariation = useCallback((id: string) => {
    if (!variations) return;

    const selected = variations.find(v => v.id === id);
    if (selected) {
      setPattern(selected.pattern);
      setVariations(null);
    }
  }, [variations]);

  const clearVariations = useCallback(() => {
    setVariations(null);
  }, []);

  const addHit = useCallback((drum: DrumPiece, time: number, velocity: number) => {
    setPattern(prev => {
      if (!prev) return prev;

      const newHit: DrumHit = {
        id: generateHitId(),
        drum,
        time,
        velocity: Math.max(0, Math.min(127, velocity)),
      };

      return {
        ...prev,
        hits: [...prev.hits, newHit].sort((a, b) => a.time - b.time),
      };
    });
  }, []);

  const removeHit = useCallback((hitId: string) => {
    setPattern(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        hits: prev.hits.filter(h => h.id !== hitId),
      };
    });
  }, []);

  const updateHitVelocity = useCallback((hitId: string, velocity: number) => {
    setPattern(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        hits: prev.hits.map(h =>
          h.id === hitId
            ? { ...h, velocity: Math.max(0, Math.min(127, velocity)) }
            : h
        ),
      };
    });
  }, []);

  return {
    pattern,
    loading,
    regenerating,
    generatingVariations,
    variations,
    error,
    prompt,
    setPrompt,
    generate,
    regenerate,
    generateVariations: handleGenerateVariations,
    selectVariation,
    clearVariations,
    setError,
    setPattern,
    addHit,
    removeHit,
    updateHitVelocity,
    cancelRequest,
  };
};
