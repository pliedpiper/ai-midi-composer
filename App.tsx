import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { availableModels, assertModelListPresent, isValidModelId } from './services/models';
import { useAutoSaveMidi } from './hooks';
import NavBar from './components/NavBar';
import MelodicPage from './components/MelodicPage';
import DrumPage from './components/drums/DrumPage';

const App = () => {
  const [modelId, setModelId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const {
    isEnabled: autoSaveEnabled,
    isSupported: autoSaveSupported,
    lastSavedFile,
    error: autoSaveError,
    enableAutoSave,
    disableAutoSave,
    saveMidi,
  } = useAutoSaveMidi();

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
  }, []);

  // Handle auto-save errors
  useEffect(() => {
    if (autoSaveError) {
      setError(autoSaveError);
    }
  }, [autoSaveError]);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <NavBar
          modelId={modelId}
          onModelChange={setModelId}
          autoSaveSupported={autoSaveSupported}
          autoSaveEnabled={autoSaveEnabled}
          lastSavedFile={lastSavedFile}
          onEnableAutoSave={enableAutoSave}
          onDisableAutoSave={disableAutoSave}
        />

        {/* Global Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto px-6 pt-4">
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
              }}
            >
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <MelodicPage
                modelId={modelId}
                autoSaveEnabled={autoSaveEnabled}
                saveMidi={saveMidi}
                onError={handleError}
              />
            }
          />
          <Route
            path="/midi"
            element={
              <MelodicPage
                modelId={modelId}
                autoSaveEnabled={autoSaveEnabled}
                saveMidi={saveMidi}
                onError={handleError}
              />
            }
          />
          <Route
            path="/drums"
            element={
              <DrumPage
                modelId={modelId}
                autoSaveEnabled={autoSaveEnabled}
                onError={handleError}
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
