import { useState, useCallback } from 'react';
import { generateMusic, addMusicPart } from '../services/geminiService';
import { Composition, PartType } from '../types';
import { assertModelListPresent, isValidModelId } from '../services/models';

interface UseCompositionReturn {
  composition: Composition | null;
  loading: boolean;
  addingPart: PartType | null;
  error: string | null;
  generate: (prompt: string, modelId: string) => Promise<void>;
  addPart: (partType: PartType, modelId: string) => Promise<void>;
  clearError: () => void;
  setError: (error: string | null) => void;
}

export const useComposition = (): UseCompositionReturn => {
  const [composition, setComposition] = useState<Composition | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingPart, setAddingPart] = useState<PartType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const generate = useCallback(async (prompt: string, modelId: string) => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setComposition(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }
      const data = await generateMusic(prompt, modelId);
      setComposition(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate music");
    } finally {
      setLoading(false);
    }
  }, []);

  const addPart = useCallback(async (partType: PartType, modelId: string) => {
    if (!composition) return;

    setAddingPart(partType);
    setError(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }
      const updatedComposition = await addMusicPart(composition, partType, modelId);
      setComposition(updatedComposition);
    } catch (err: any) {
      setError(err.message || `Failed to add ${partType}`);
    } finally {
      setAddingPart(null);
    }
  }, [composition]);

  return {
    composition,
    loading,
    addingPart,
    error,
    generate,
    addPart,
    clearError,
    setError,
  };
};

