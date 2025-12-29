import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { availableModels } from '../services/models';

interface NavBarProps {
  modelId: string;
  onModelChange: (modelId: string) => void;
  autoSaveSupported: boolean;
  autoSaveEnabled: boolean;
  lastSavedFile: string | null;
  onEnableAutoSave: () => void;
  onDisableAutoSave: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
  modelId,
  onModelChange,
  autoSaveSupported,
  autoSaveEnabled,
  lastSavedFile,
  onEnableAutoSave,
  onDisableAutoSave,
}) => {
  const location = useLocation();
  const isDrums = location.pathname === '/drums';

  return (
    <header className="header sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
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

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className="font-mono text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: !isDrums ? 'var(--accent)' : 'transparent',
                color: !isDrums ? 'white' : 'var(--text-secondary)',
                border: !isDrums ? '1px solid var(--accent)' : '1px solid transparent',
              }}
            >
              Melodic
            </Link>
            <Link
              to="/drums"
              className="font-mono text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: isDrums ? 'var(--accent)' : 'transparent',
                color: isDrums ? 'white' : 'var(--text-secondary)',
                border: isDrums ? '1px solid var(--accent)' : '1px solid transparent',
              }}
            >
              Drums
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-save toggle */}
          {autoSaveSupported && (
            <button
              onClick={autoSaveEnabled ? onDisableAutoSave : onEnableAutoSave}
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

          {/* Model selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Model:</span>
            <select
              value={modelId}
              onChange={(e) => {
                const next = e.target.value;
                onModelChange(next);
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
  );
};

export default NavBar;
