// File System Access API service for auto-saving MIDI files

const DB_NAME = 'midi-composer-db';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const HANDLE_KEY = 'outputDirectory';

/**
 * Check if File System Access API is supported
 */
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

/**
 * Open IndexedDB database
 */
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * Persist directory handle to IndexedDB
 */
export const persistDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, HANDLE_KEY);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    tx.oncomplete = () => db.close();
  });
};

/**
 * Retrieve persisted directory handle from IndexedDB
 */
export const getPersistedDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);

      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
};

/**
 * Clear persisted directory handle from IndexedDB
 */
export const clearPersistedDirectoryHandle = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      tx.oncomplete = () => db.close();
    });
  } catch {
    // Ignore errors when clearing
  }
};

/**
 * Verify and request permission for a directory handle
 */
export const verifyPermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  try {
    // Check current permission state
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') {
      return true;
    }

    // Request permission if not granted
    const requested = await handle.requestPermission({ mode: 'readwrite' });
    return requested === 'granted';
  } catch {
    return false;
  }
};

/**
 * Request directory access from user via folder picker
 */
export const requestDirectoryAccess = async (): Promise<FileSystemDirectoryHandle> => {
  const dirHandle = await window.showDirectoryPicker({
    id: 'midi-output',
    mode: 'readwrite',
    startIn: 'downloads'
  });

  // Persist the handle for future sessions
  await persistDirectoryHandle(dirHandle);

  return dirHandle;
};

/**
 * Save MIDI blob to the specified directory
 */
export const saveMidiToDirectory = async (
  dirHandle: FileSystemDirectoryHandle,
  blob: Blob,
  filename: string
): Promise<void> => {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
};

/**
 * Generate a unique filename with timestamp
 */
export const generateMidiFilename = (title: string): string => {
  const sanitizedTitle = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .substring(0, 19);

  return `${sanitizedTitle}_${timestamp}.mid`;
};
