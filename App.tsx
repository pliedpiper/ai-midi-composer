import React, { useState, useEffect } from 'react';
import { createMidiFile } from './services/midiEncoder';
import { availableModels, assertModelListPresent, isValidModelId } from './services/models';
import { usePlayback, useComposition } from './hooks';
import PromptInput from './components/PromptInput';
import CompositionCard from './components/CompositionCard';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState<string>('');

  const {
    composition,
    loading,
    addingPart,
    error,
    generate,
    addPart,
    setError,
  } = useComposition();

  const { isPlaying, startPlayback, stopPlayback } = usePlayback({
    notes: composition?.notes ?? [],
    bpm: composition?.bpm ?? 120,
  });

  // Initialize model selection
  useEffect(() => {
    try {
      assertModelListPresent();
    } catch (e: any) {
      setError(e.message || "Failed to load models.txt");
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

  const handleGenerate = async () => {
    if (isPlaying) stopPlayback();
    await generate(prompt, modelId);
  };

  const handleAddPart = async (partType: 'melody' | 'chords' | 'bass') => {
    if (isPlaying) stopPlayback();
    await addPart(partType, modelId);
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ 
        background: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--border)' 
      }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-mono text-sm font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
            midi-composer
          </h1>
          <select
            value={modelId}
            onChange={(e) => {
              const next = e.target.value;
              setModelId(next);
              localStorage.setItem("selectedModelId", next);
            }}
            className="font-mono text-xs px-2 py-1 rounded border-none"
            style={{ 
              background: 'var(--bg-tertiary)', 
              color: 'var(--text-secondary)',
              maxWidth: '200px'
            }}
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>{m.id}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <PromptInput
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          loading={loading}
          disabled={!modelId}
          error={error}
        />

        {composition && (
          <CompositionCard
            composition={composition}
            isPlaying={isPlaying}
            addingPart={addingPart}
            onPlay={startPlayback}
            onStop={stopPlayback}
            onDownload={handleDownloadMidi}
            onAddPart={handleAddPart}
          />
        )}

        {/* Empty State */}
        {!composition && !loading && (
          <div 
            className="rounded py-24 text-center"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px dashed var(--border)' 
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Generated MIDI will appear here
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
