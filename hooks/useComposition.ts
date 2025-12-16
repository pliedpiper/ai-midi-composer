import { useState, useCallback, useRef } from 'react';
import {
  generateMusic,
  generateMusicWithLength,
  addMusicPart,
  regeneratePart as regeneratePartService,
  generateVariations as generateVariationsService,
  applyStyleTransfer,
  extendComposition,
} from '../services/geminiService';
import { Composition, PartType, BarCount, CompositionVariation } from '../types';
import { assertModelListPresent, isValidModelId } from '../services/models';

interface UseCompositionReturn {
  composition: Composition | null;
  loading: boolean;
  addingPart: PartType | null;
  regeneratingPart: PartType | null;
  generatingVariations: boolean;
  applyingStyle: boolean;
  extending: boolean;
  variations: CompositionVariation[] | null;
  error: string | null;
  generate: (prompt: string, modelId: string, barCount?: BarCount) => Promise<void>;
  addPart: (partType: PartType, modelId: string) => Promise<void>;
  regeneratePart: (partType: PartType, modelId: string) => Promise<void>;
  generateVariations: (count: 2 | 3, modelId: string) => Promise<void>;
  selectVariation: (variationId: string) => void;
  clearVariations: () => void;
  applyStyle: (stylePrompt: string, modelId: string) => Promise<void>;
  extend: (barCount: BarCount, modelId: string) => Promise<void>;
  clearError: () => void;
  setError: (error: string | null) => void;
  setComposition: (composition: Composition | null) => void;
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
  const [regeneratingPart, setRegeneratingPart] = useState<PartType | null>(null);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [applyingStyle, setApplyingStyle] = useState(false);
  const [extending, setExtending] = useState(false);
  const [variations, setVariations] = useState<CompositionVariation[] | null>(null);
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

  /**
   * Check if any operation is in progress
   */
  const isOperationInProgress = useCallback(() => {
    return loading || addingPart !== null || regeneratingPart !== null ||
           generatingVariations || applyingStyle || extending;
  }, [loading, addingPart, regeneratingPart, generatingVariations, applyingStyle, extending]);

  const generate = useCallback(async (prompt: string, modelId: string, barCount?: BarCount) => {
    if (!prompt.trim()) return;

    // Cancel any existing request before starting a new one
    cancelRequest();

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setComposition(null);
    setVariations(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }

      // Use length-specific generation if barCount is provided
      const data = barCount
        ? await generateMusicWithLength(prompt, barCount, modelId, controller.signal)
        : await generateMusic(prompt, modelId, controller.signal);

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
    if (isOperationInProgress()) {
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
  }, [composition, isOperationInProgress, cancelRequest]);

  const regeneratePart = useCallback(async (partType: PartType, modelId: string) => {
    const currentComposition = composition;
    if (!currentComposition) {
      setError("No composition to regenerate part in");
      return;
    }

    if (isOperationInProgress()) {
      setError("Please wait for the current operation to complete");
      return;
    }

    cancelRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setRegeneratingPart(partType);
    setError(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }

      const updatedComposition = await regeneratePartService(
        currentComposition,
        partType,
        modelId,
        controller.signal
      );

      if (!controller.signal.aborted) {
        setComposition(updatedComposition);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err) || `Failed to regenerate ${partType}`);
      }
    } finally {
      if (!controller.signal.aborted) {
        setRegeneratingPart(null);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [composition, isOperationInProgress, cancelRequest]);

  const generateVariationsMethod = useCallback(async (count: 2 | 3, modelId: string) => {
    const currentComposition = composition;
    if (!currentComposition) {
      setError("No composition to create variations from");
      return;
    }

    if (isOperationInProgress()) {
      setError("Please wait for the current operation to complete");
      return;
    }

    cancelRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setGeneratingVariations(true);
    setError(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }

      const vars = await generateVariationsService(
        currentComposition,
        count,
        modelId,
        controller.signal
      );

      if (!controller.signal.aborted) {
        setVariations(vars);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err) || "Failed to generate variations");
      }
    } finally {
      if (!controller.signal.aborted) {
        setGeneratingVariations(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [composition, isOperationInProgress, cancelRequest]);

  const selectVariation = useCallback((variationId: string) => {
    if (!variations) return;
    const selected = variations.find(v => v.id === variationId);
    if (selected) {
      setComposition(selected.composition);
      setVariations(null);
    }
  }, [variations]);

  const clearVariations = useCallback(() => {
    setVariations(null);
  }, []);

  const applyStyle = useCallback(async (stylePrompt: string, modelId: string) => {
    const currentComposition = composition;
    if (!currentComposition) {
      setError("No composition to apply style to");
      return;
    }

    if (!stylePrompt.trim()) {
      setError("Please enter a style description");
      return;
    }

    if (isOperationInProgress()) {
      setError("Please wait for the current operation to complete");
      return;
    }

    cancelRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setApplyingStyle(true);
    setError(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }

      const updatedComposition = await applyStyleTransfer(
        currentComposition,
        stylePrompt,
        modelId,
        controller.signal
      );

      if (!controller.signal.aborted) {
        setComposition(updatedComposition);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err) || "Failed to apply style");
      }
    } finally {
      if (!controller.signal.aborted) {
        setApplyingStyle(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [composition, isOperationInProgress, cancelRequest]);

  const extend = useCallback(async (barCount: BarCount, modelId: string) => {
    const currentComposition = composition;
    if (!currentComposition) {
      setError("No composition to extend");
      return;
    }

    if (isOperationInProgress()) {
      setError("Please wait for the current operation to complete");
      return;
    }

    cancelRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setExtending(true);
    setError(null);

    try {
      assertModelListPresent();
      if (!modelId) throw new Error("No model selected.");
      if (!isValidModelId(modelId)) {
        throw new Error(`Invalid model "${modelId}".`);
      }

      const updatedComposition = await extendComposition(
        currentComposition,
        barCount,
        modelId,
        controller.signal
      );

      if (!controller.signal.aborted) {
        setComposition(updatedComposition);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err) || "Failed to extend composition");
      }
    } finally {
      if (!controller.signal.aborted) {
        setExtending(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [composition, isOperationInProgress, cancelRequest]);

  return {
    composition,
    loading,
    addingPart,
    regeneratingPart,
    generatingVariations,
    applyingStyle,
    extending,
    variations,
    error,
    generate,
    addPart,
    regeneratePart,
    generateVariations: generateVariationsMethod,
    selectVariation,
    clearVariations,
    applyStyle,
    extend,
    clearError,
    setError,
    setComposition,
    cancelRequest,
  };
};
