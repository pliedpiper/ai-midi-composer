import { useState, useCallback } from 'react';
import { InstrumentDefinition } from '../types';
import { DEFAULT_INSTRUMENT_ID, getInstrumentDefinition } from '../services/instruments';

interface UseInstrumentReturn {
  instrumentId: string;
  instrument: InstrumentDefinition | undefined;
  setInstrumentId: (id: string) => void;
}

export const useInstrument = (): UseInstrumentReturn => {
  const [instrumentId, setInstrumentIdState] = useState<string>(DEFAULT_INSTRUMENT_ID);

  const setInstrumentId = useCallback((id: string) => {
    setInstrumentIdState(id);
  }, []);

  const instrument = getInstrumentDefinition(instrumentId);

  return {
    instrumentId,
    instrument,
    setInstrumentId,
  };
};
