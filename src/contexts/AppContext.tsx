import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PipelineKey } from '@/lib/types';

interface AppContextType {
  selectedPipeline: PipelineKey;
  setSelectedPipeline: (p: PipelineKey) => void;
  selectedDealId: number | null;
  setSelectedDealId: (id: number | null) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineKey>('default');
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <AppContext.Provider value={{ selectedPipeline, setSelectedPipeline, selectedDealId, setSelectedDealId, isChatOpen, setIsChatOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
