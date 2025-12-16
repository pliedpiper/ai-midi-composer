import { useState, useCallback, useRef } from 'react';
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
  cancelRequest: () => void;
}

/**
 * Extracts error message from unknown error type.
 */
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return 'An unexpected error occurred';
};

export const useComposition = (): UseCompositionReturn => {
  const [composition, setComposition] = useState<Composition | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingPart, setAddingPart] = useState<PartType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AbortController for canceling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Cancels any in-flight API request.
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const generate = useCallback(async (prompt: string, modelId: string) => {
    if (!prompt.trim()) return;

    // Cancel any existing request before starting a new one
    cancelRequest();

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setComposition(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }
      const data = await generateMusic(prompt, modelId, controller.signal);

      // Only update state if this request wasn't aborted
      if (!controller.signal.aborted) {
        setComposition(data);
      }
    } catch (err) {
      // Ignore abort errors (user canceled)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err) || "Failed to generate music");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
      // Clean up controller reference
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [cancelRequest]);

  const addPart = useCallback(async (partType: PartType, modelId: string) => {
    // Capture composition at call time to avoid stale closure
    const currentComposition = composition;
    if (!currentComposition) {
      setError("No composition to add part to");
      return;
    }

    // Prevent adding part while another operation is in progress
    if (loading || addingPart) {
      setError("Please wait for the current operation to complete");
      return;
    }

    // Cancel any existing request before starting a new one
    cancelRequest();

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAddingPart(partType);
    setError(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }
      const updatedComposition = await addMusicPart(
        currentComposition,
        partType,
        modelId,
        controller.signal
      );

      // Only update state if this request wasn't aborted
      if (!controller.signal.aborted) {
        setComposition(updatedComposition);
      }
    } catch (err) {
      // Ignore abort errors (user canceled)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err) || `Failed to add ${partType}`);
      }
    } finally {
      if (!controller.signal.aborted) {
        setAddingPart(null);
      }
      // Clean up controller reference
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [composition, loading, addingPart, cancelRequest]);

  return {
    composition,
    loading,
    addingPart,
    error,
    generate,
    addPart,
    clearError,
    setError,
    cancelRequest,
  };
};
