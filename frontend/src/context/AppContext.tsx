import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GenerationResult, HistoryItem } from '../types/api.types';

interface AppState {
  // Generation state
  isGenerating: boolean;
  currentGeneration: GenerationResult | null;
  generationError: string | null;

  // History state
  history: HistoryItem[];
  historyLoading: boolean;
  historyError: string | null;
}

interface AppContextType extends AppState {
  // Generation actions
  setIsGenerating: (isGenerating: boolean) => void;
  setCurrentGeneration: (generation: GenerationResult | null) => void;
  setGenerationError: (error: string | null) => void;
  clearGeneration: () => void;

  // History actions
  setHistory: (history: HistoryItem[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  setHistoryError: (error: string | null) => void;
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isGenerating: false,
    currentGeneration: null,
    generationError: null,
    history: [],
    historyLoading: false,
    historyError: null,
  });

  const setIsGenerating = (isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  };

  const setCurrentGeneration = (generation: GenerationResult | null) => {
    setState((prev) => ({ ...prev, currentGeneration: generation }));
  };

  const setGenerationError = (error: string | null) => {
    setState((prev) => ({ ...prev, generationError: error }));
  };

  const clearGeneration = () => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      currentGeneration: null,
      generationError: null,
    }));
  };

  const setHistory = (history: HistoryItem[]) => {
    setState((prev) => ({ ...prev, history }));
  };

  const setHistoryLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, historyLoading: loading }));
  };

  const setHistoryError = (error: string | null) => {
    setState((prev) => ({ ...prev, historyError: error }));
  };

  const addHistoryItem = (item: HistoryItem) => {
    setState((prev) => ({ ...prev, history: [item, ...prev.history] }));
  };

  const removeHistoryItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((item) => item.id !== id),
    }));
  };

  const value: AppContextType = {
    ...state,
    setIsGenerating,
    setCurrentGeneration,
    setGenerationError,
    clearGeneration,
    setHistory,
    setHistoryLoading,
    setHistoryError,
    addHistoryItem,
    removeHistoryItem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
