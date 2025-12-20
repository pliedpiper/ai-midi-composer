import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { parseMidiFile } from '../services/midiImporter';
import { Composition } from '../types';

interface MidiUploadButtonProps {
  onUpload: (composition: Composition) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const MidiUploadButton: React.FC<MidiUploadButtonProps> = ({
  onUpload,
  onError,
  disabled = false,
  variant = 'secondary',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && !isLoading) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    setIsLoading(true);
    try {
      const composition = await parseMidiFile(file);
      onUpload(composition);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to parse MIDI file');
    } finally {
      setIsLoading(false);
    }
  };

  const isPrimary = variant === 'primary';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className="btn px-4 py-2 rounded-lg transition-all font-medium text-sm flex items-center gap-2"
        style={{
          background: isPrimary
            ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)'
            : 'var(--bg-primary)',
          color: isPrimary ? 'white' : 'var(--text-secondary)',
          border: isPrimary ? 'none' : '1px solid var(--border)',
          boxShadow: isPrimary ? 'var(--shadow-sm), 0 0 15px rgba(61, 139, 255, 0.2)' : 'none',
          opacity: disabled || isLoading ? 0.6 : 1,
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        }}
        aria-label="Upload MIDI file"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Loading...' : 'Upload MIDI'}</span>
      </button>
    </>
  );
};

export default MidiUploadButton;
