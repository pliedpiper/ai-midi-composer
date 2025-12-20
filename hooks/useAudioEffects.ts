import { useState, useCallback } from 'react';
import { FilterState } from '../types';
import { getInitialFilterStates, getFilterDefinition } from '../services/audioFilters';

interface UseAudioEffectsReturn {
  filterStates: FilterState[];
  toggleFilter: (filterId: string) => void;
  updateFilterParam: (filterId: string, paramKey: string, value: number) => void;
  resetFilters: () => void;
}

export const useAudioEffects = (): UseAudioEffectsReturn => {
  const [filterStates, setFilterStates] = useState<FilterState[]>(() => getInitialFilterStates());

  const toggleFilter = useCallback((filterId: string) => {
    setFilterStates(prev =>
      prev.map(filter =>
        filter.id === filterId
          ? { ...filter, enabled: !filter.enabled }
          : filter
      )
    );
  }, []);

  const updateFilterParam = useCallback((filterId: string, paramKey: string, value: number) => {
    setFilterStates(prev =>
      prev.map(filter =>
        filter.id === filterId
          ? {
              ...filter,
              params: {
                ...filter.params,
                [paramKey]: value,
              },
            }
          : filter
      )
    );
  }, []);

  const resetFilters = useCallback(() => {
    setFilterStates(getInitialFilterStates());
  }, []);

  return {
    filterStates,
    toggleFilter,
    updateFilterParam,
    resetFilters,
  };
};

// Helper to get a specific filter's state
export const getFilterState = (filterStates: FilterState[], filterId: string): FilterState | undefined => {
  return filterStates.find(f => f.id === filterId);
};

// Helper to check if any effects are enabled
export const hasEnabledEffects = (filterStates: FilterState[]): boolean => {
  return filterStates.some(f => f.enabled);
};
