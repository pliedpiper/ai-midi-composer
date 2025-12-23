import React, { useState, useEffect, useRef } from 'react';
import { createMidiFile } from './services/midiEncoder';
import { exportToWav, downloadBlob } from './services/wavExporter';
import { availableModels, assertModelListPresent, isValidModelId } from './services/models';
import { usePlayback, useComposition, useAudioEffects, useInstrument, useAutoSaveMidi } from './hooks';
import PromptInput from './components/PromptInput';
import CompositionCard from './components/CompositionCard';
import { VariationPicker } from './components/VariationPicker';
import MidiUploadButton from './components/MidiUploadButton';
import { AUDIO } from './constants';
import { BarCount, Composition, PartType, NoteEvent } from './types';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState<string>('');
  const [variationPreviewId, setVariationPreviewId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [noteDuration, setNoteDuration] = useState(1); // Default to quarter note
  const variationPlaybackRef = useRef<{ stop: () => void } | null>(null);

  const {
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
    generateVariations,
    selectVariation,
    clearVariations,
    applyStyle,
    extend,
    setError,
    setComposition,
    addNote,
    removeNote,
  } = useComposition();

  const {
    filterStates,
    toggleFilter,
    updateFilterParam,
    resetFilters,
  } = useAudioEffects();

  const {
    instrumentId,
    setInstrumentId,
  } = useInstrument();

  const {
    isEnabled: autoSaveEnabled,
    isSupported: autoSaveSupported,
    lastSavedFile,
    error: autoSaveError,
    enableAutoSave,
    disableAutoSave,
    saveMidi,
  } = useAutoSaveMidi();

  // Track if composition change is from MIDI upload (should not auto-save)
  const isFromUploadRef = useRef(false);
  // Track previous composition to detect changes
  const prevCompositionRef = useRef<typeof composition>(null);

  const { isPlaying, startPlayback, stopPlayback } = usePlayback({
    notes: composition?.notes ?? [],
    bpm: composition?.bpm ?? AUDIO.DEFAULT_BPM,
    filterStates,
    instrumentId,
    onError: setError,
  });

  // Initialize model selection
  useEffect(() => {
    try {
      assertModelListPresent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load models.txt");
      if (availableModels.length > 0) {
        setModelId(availableModels[0]!.id);
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("model") || params.get("--model") || "";
    const fromStorage = localStorage.getItem("selectedModelId") || "";
    const initial = fromUrl || fromStorage;

    if (initial) {
      if (!isValidModelId(initial)) {
        setError(`Invalid model "${initial}". Select from models.txt.`);
        const fallback = availableModels[0]!.id;
        setModelId(fallback);
        localStorage.setItem("selectedModelId", fallback);
        return;
      }
      setModelId(initial);
      localStorage.setItem("selectedModelId", initial);
      return;
    }

    if (typeof window.prompt === "function") {
      const options = availableModels
        .map((m, i) => `${i + 1}) ${m.label} (${m.id})`)
        .join("\n");
      const input = window.prompt(
        `Choose a model from models.txt:\n\n${options}\n\nEnter a number or a model id:`,
        "1"
      );
      const trimmed = (input || "").trim();
      const byIndex = Number.parseInt(trimmed, 10);
      const chosen =
        Number.isFinite(byIndex) && byIndex >= 1 && byIndex <= availableModels.length
          ? availableModels[byIndex - 1]!.id
          : trimmed;
      const finalModelId = isValidModelId(chosen) ? chosen : availableModels[0]!.id;
      setModelId(finalModelId);
      localStorage.setItem("selectedModelId", finalModelId);
      return;
    }

    setModelId(availableModels[0]!.id);
  }, [setError]);

  // Auto-save MIDI when composition changes from AI generation
  useEffect(() => {
    if (!composition || !autoSaveEnabled) return;

    // Skip if composition is the same reference (no actual change)
    if (prevCompositionRef.current === composition) return;

    // Skip if this change came from MIDI upload
    if (isFromUploadRef.current) {
      isFromUploadRef.current = false;
      prevCompositionRef.current = composition;
      return;
    }

    // Skip initial mount (no previous composition)
    if (prevCompositionRef.current === null) {
      prevCompositionRef.current = composition;
      return;
    }

    // Auto-save the new composition
    saveMidi(composition);
    prevCompositionRef.current = composition;
  }, [composition, autoSaveEnabled, saveMidi]);

  const handleGenerate = async (barCount?: BarCount) => {
    if (isPlaying) stopPlayback();
    await generate(prompt, modelId, barCount);
  };

  const handleAddPart = async (partType: PartType) => {
    if (isPlaying) stopPlayback();
    await addPart(partType, modelId);
  };

  const handleRegeneratePart = async (partType: PartType) => {
    if (isPlaying) stopPlayback();
    await regeneratePart(partType, modelId);
  };

  const handleGenerateVariations = async () => {
    if (isPlaying) stopPlayback();
    await generateVariations(3, modelId);
  };

  const handleApplyStyle = async (stylePrompt: string) => {
    if (isPlaying) stopPlayback();
    await applyStyle(stylePrompt, modelId);
  };

  const handleExtend = async (barCount: BarCount) => {
    if (isPlaying) stopPlayback();
    await extend(barCount, modelId);
  };

  const handleMidiUpload = (uploadedComposition: Composition) => {
    if (isPlaying) stopPlayback();
    clearVariations();
    // Mark as upload so auto-save is skipped
    isFromUploadRef.current = true;
    setComposition(uploadedComposition);
  };

  const handleDownloadMidi = () => {
    if (!composition) return;
    const blob = createMidiFile(composition.notes, composition.bpm);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${composition.title.replace(/\s+/g, '_')}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWav = async () => {
    if (!composition) return;

    setIsExporting(true);
    try {
      const blob = await exportToWav({
        notes: composition.notes,
        bpm: composition.bpm,
        filterStates,
        instrumentId,
      });
      downloadBlob(blob, `${composition.title.replace(/\s+/g, '_')}.wav`);
    } catch (e) {
      setError(`Failed to export WAV: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Variation preview playback handlers
  const handlePlayVariation = (id: string, _composition: Composition) => {
    // Stop any existing preview
    if (variationPlaybackRef.current) {
      variationPlaybackRef.current.stop();
    }
    setVariationPreviewId(id);
    // Note: In a full implementation, you'd create a separate playback instance
    // For now, we just track which variation is "playing" visually
  };

  const handleStopVariationPreview = () => {
    if (variationPlaybackRef.current) {
      variationPlaybackRef.current.stop();
    }
    setVariationPreviewId(null);
  };

  const handleSelectVariation = (id: string) => {
    handleStopVariationPreview();
    selectVariation(id);
  };

  const handleCancelVariations = () => {
    handleStopVariationPreview();
    clearVariations();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="header sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h1 className="font-mono text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              midi-composer
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Auto-save toggle */}
            {autoSaveSupported && (
              <button
                onClick={autoSaveEnabled ? disableAutoSave : enableAutoSave}
                className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: autoSaveEnabled ? 'var(--accent)' : 'var(--bg-primary)',
                  color: autoSaveEnabled ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${autoSaveEnabled ? 'var(--accent)' : 'var(--border)'}`,
                }}
                title={autoSaveEnabled ? `Auto-saving to folder${lastSavedFile ? ` (last: ${lastSavedFile})` : ''}` : 'Click to enable auto-save'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
                {autoSaveEnabled ? 'Auto-save ON' : 'Auto-save'}
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Model:</span>
              <select
                value={modelId}
                onChange={(e) => {
                  const next = e.target.value;
                  setModelId(next);
                  localStorage.setItem("selectedModelId", next);
                }}
                className="font-mono text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  maxWidth: '220px'
                }}
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.id}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-1">
            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              onGenerate={handleGenerate}
              loading={loading}
              disabled={!modelId}
              error={error}
            />
          </div>
          <div className="pt-1">
            <MidiUploadButton
              onUpload={handleMidiUpload}
              onError={setError}
              disabled={loading}
            />
          </div>
        </div>

        {composition && (
          <CompositionCard
            composition={composition}
            isPlaying={isPlaying}
            addingPart={addingPart}
            regeneratingPart={regeneratingPart}
            applyingStyle={applyingStyle}
            extending={extending}
            generatingVariations={generatingVariations}
            isExporting={isExporting}
            filterStates={filterStates}
            instrumentId={instrumentId}
            onPlay={startPlayback}
            onStop={stopPlayback}
            onDownloadMidi={handleDownloadMidi}
            onDownloadWav={handleDownloadWav}
            onAddPart={handleAddPart}
            onRegeneratePart={handleRegeneratePart}
            onApplyStyle={handleApplyStyle}
            onExtend={handleExtend}
            onGenerateVariations={handleGenerateVariations}
            onToggleFilter={toggleFilter}
            onUpdateFilterParam={updateFilterParam}
            onResetFilters={resetFilters}
            onSelectInstrument={setInstrumentId}
            onAddNote={addNote}
            onRemoveNote={removeNote}
            noteDuration={noteDuration}
            onNoteDurationChange={setNoteDuration}
          />
        )}

        {/* Variation Picker Modal */}
        {variations && (
          <VariationPicker
            variations={variations}
            onSelect={handleSelectVariation}
            onCancel={handleCancelVariations}
            currentlyPlaying={variationPreviewId}
            onPlayVariation={handlePlayVariation}
            onStopPlayback={handleStopVariationPreview}
          />
        )}

        {/* Empty State */}
        {!composition && !loading && (
          <div className="empty-state py-20 text-center">
            <div className="relative z-10">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)'
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                No composition yet
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Describe your music above and click Generate
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                <MidiUploadButton
                  onUpload={handleMidiUpload}
                  onError={setError}
                  variant="primary"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
