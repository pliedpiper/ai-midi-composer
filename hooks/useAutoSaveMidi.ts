import { useState, useEffect, useCallback } from 'react';
import { createMidiFile } from '../services/midiEncoder';
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  getPersistedDirectoryHandle,
  clearPersistedDirectoryHandle,
  verifyPermission,
  saveMidiToDirectory,
  generateMidiFilename,
} from '../services/fileSystemService';
import { Composition } from '../types';

interface UseAutoSaveMidiReturn {
  isEnabled: boolean;
  isSupported: boolean;
  hasDirectoryAccess: boolean;
  lastSavedFile: string | null;
  error: string | null;
  enableAutoSave: () => Promise<void>;
  disableAutoSave: () => void;
  saveMidi: (composition: Composition) => Promise<void>;
}

export const useAutoSaveMidi = (): UseAutoSaveMidiReturn => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastSavedFile, setLastSavedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSupported = isFileSystemAccessSupported();

  // On mount, try to restore persisted directory handle
  useEffect(() => {
    if (!isSupported) return;

    const restoreHandle = async () => {
      try {
        const handle = await getPersistedDirectoryHandle();
        if (handle) {
          const hasPermission = await verifyPermission(handle);
          if (hasPermission) {
            setDirectoryHandle(handle);
            setIsEnabled(true);
          } else {
            // Permission was revoked, clear the stored handle
            await clearPersistedDirectoryHandle();
          }
        }
      } catch {
        // Ignore errors during restoration
      }
    };

    restoreHandle();
  }, [isSupported]);

  const enableAutoSave = useCallback(async () => {
    if (!isSupported) {
      setError('File System Access API is not supported in this browser');
      return;
    }

    try {
      setError(null);
      const handle = await requestDirectoryAccess();
      setDirectoryHandle(handle);
      setIsEnabled(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled the folder picker
        return;
      }
      setError('Failed to get directory access');
    }
  }, [isSupported]);

  const disableAutoSave = useCallback(() => {
    setIsEnabled(false);
    setDirectoryHandle(null);
    setLastSavedFile(null);
    clearPersistedDirectoryHandle();
  }, []);

  const saveMidi = useCallback(async (composition: Composition) => {
    if (!isEnabled || !directoryHandle) return;

    try {
      setError(null);

      // Verify we still have permission
      const hasPermission = await verifyPermission(directoryHandle);
      if (!hasPermission) {
        setError('Permission to save files was revoked. Please re-enable auto-save.');
        setIsEnabled(false);
        setDirectoryHandle(null);
        return;
      }

      const blob = createMidiFile(composition.notes, composition.bpm);
      const filename = generateMidiFilename(composition.title);

      await saveMidiToDirectory(directoryHandle, blob, filename);
      setLastSavedFile(filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save MIDI file';
      setError(message);
    }
  }, [isEnabled, directoryHandle]);

  return {
    isEnabled,
    isSupported,
    hasDirectoryAccess: !!directoryHandle,
    lastSavedFile,
    error,
    enableAutoSave,
    disableAutoSave,
    saveMidi,
  };
};
