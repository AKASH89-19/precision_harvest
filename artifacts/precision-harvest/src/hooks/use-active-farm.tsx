import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveFarmContextType {
  activeFarmId: string | null;
  setActiveFarmId: (id: string | null) => void;
}

const ActiveFarmContext = createContext<ActiveFarmContextType | undefined>(undefined);

export function ActiveFarmProvider({ children }: { children: ReactNode }) {
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);

  return (
    <ActiveFarmContext.Provider value={{ activeFarmId, setActiveFarmId }}>
      {children}
    </ActiveFarmContext.Provider>
  );
}

export function useActiveFarm() {
  const context = useContext(ActiveFarmContext);
  if (context === undefined) {
    throw new Error('useActiveFarm must be used within an ActiveFarmProvider');
  }
  return context;
}
