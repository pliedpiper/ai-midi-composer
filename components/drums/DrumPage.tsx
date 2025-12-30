import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useDrumComposition } from '../../hooks/useDrumComposition';
import { useDrumPlayback } from '../../hooks/useDrumPlayback';
import { useAudioEffects } from '../../hooks';
import { createDrumMidiFile } from '../../services/drumMidiEncoder';
import { parseDrumMidiFile } from '../../services/drumMidiImporter';
import { DrumPattern } from '../../types/drums';
import DrumPromptInput from './DrumPromptInput';
import DrumCompositionCard from './DrumCompositionCard';
import DrumVariationPicker from './DrumVariationPicker';
import { AUDIO } from '../../constants';

interface DrumPageProps {
  modelId: string;
  autoSaveEnabled: boolean;
  onError: (error: string) => void;
}

const DrumPage: React.FC<DrumPageProps> = ({
  modelId,
  autoSaveEnabled,
  onError,
}) => {
  const [variationPreviewId, setVariationPreviewId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variationPlaybackRef = useRef<{ stop: () => void } | null>(null);

  const {
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
    generateVariations,
    selectVariation,
    clearVariations,
    setError,
    setPattern,
    addHit,
    removeHit,
    updateHitVelocity,
  } = useDrumComposition();

  const {
    filterStates,
    toggleFilter,
    updateFilterParam,
    resetFilters,
  } = useAudioEffects();

  const { isPlaying, startPlayback, stopPlayback } = useDrumPlayback({
    hits: pattern?.hits ?? [],
    bpm: pattern?.bpm ?? AUDIO.DEFAULT_BPM,
    filterStates,
    onError: setError,
  });

  // Forward errors to parent
  React.useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleGenerate = async () => {
    if (isPlaying) stopPlayback();
    await generate(prompt, modelId);
  };

  const handleRegenerate = async () => {
    if (isPlaying) stopPlayback();
    await regenerate(modelId);
  };

  const handleGenerateVariations = async () => {
    if (isPlaying) stopPlayback();
    await generateVariations(3, modelId);
  };

  const handleDownloadMidi = () => {
    if (!pattern) return;
    const blob = createDrumMidiFile(pattern.hits, pattern.bpm);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pattern.title.replace(/\s+/g, '_')}_drums.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWav = async () => {
    if (!pattern) return;
    setIsExporting(true);
    try {
      // TODO: Implement WAV export for drums
      setError('WAV export for drums coming soon');
    } catch (e) {
      setError(`Failed to export WAV: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMidiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (isPlaying) stopPlayback();
      clearVariations();
      const imported = await parseDrumMidiFile(file);
      setPattern(imported);
    } catch (err) {
      setError(`Failed to import MIDI: ${err instanceof Error ? err.message : 'unknown error'}`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Variation preview handlers
  const handlePlayVariation = (id: string) => {
    if (variationPlaybackRef.current) {
      variationPlaybackRef.current.stop();
    }
    setVariationPreviewId(id);
    // Note: In a full implementation, you'd create a separate playback instance
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
    <main className="max-w-4xl mx-auto px-6 py-10">
      {/* Prompt input with upload button */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <DrumPromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            loading={loading}
            disabled={!modelId}
            error={error}
          />
        </div>
        <div className="pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleMidiUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="btn px-4 py-2 rounded-lg transition-all font-medium text-sm flex items-center gap-2"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              boxShadow: 'none',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            title="Upload MIDI file"
          >
            <Upload size={14} />
            <span>Upload MIDI</span>
          </button>
        </div>
      </div>

      {/* Pattern card */}
      {pattern && (
        <DrumCompositionCard
          pattern={pattern}
          isPlaying={isPlaying}
          regenerating={regenerating}
          generatingVariations={generatingVariations}
          isExporting={isExporting}
          filterStates={filterStates}
          onPlay={startPlayback}
          onStop={stopPlayback}
          onDownloadMidi={handleDownloadMidi}
          onDownloadWav={handleDownloadWav}
          onRegenerate={handleRegenerate}
          onGenerateVariations={handleGenerateVariations}
          onToggleFilter={toggleFilter}
          onUpdateFilterParam={updateFilterParam}
          onResetFilters={resetFilters}
          onAddHit={addHit}
          onRemoveHit={removeHit}
          onUpdateHitVelocity={updateHitVelocity}
        />
      )}

      {/* Variation Picker Modal */}
      {variations && (
        <DrumVariationPicker
          variations={variations}
          onSelect={handleSelectVariation}
          onCancel={handleCancelVariations}
          currentlyPlaying={variationPreviewId}
          onPlayVariation={handlePlayVariation}
          onStopPlayback={handleStopVariationPreview}
        />
      )}

      {/* Empty State */}
      {!pattern && !loading && (
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
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              No drum pattern yet
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Describe your drum pattern above and click Generate
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn px-4 py-2 rounded-lg transition-all font-medium text-sm flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
                  color: 'white',
                  boxShadow: 'var(--shadow-sm), 0 0 15px rgba(61, 139, 255, 0.2)',
                }}
              >
                <Upload size={14} />
                <span>Upload MIDI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DrumPage;
