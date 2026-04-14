import { createContext, useContext, useState, ReactNode } from 'react';

interface ScreeningContextType {
  latestResult: any | null;
  setLatestResult: (r: any | null) => void;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

export function ScreeningProvider({ children }: { children: ReactNode }) {
  const [latestResult, setLatestResult] = useState<any | null>(null);

  return (
    <ScreeningContext.Provider value={{ latestResult, setLatestResult }}>
      {children}
    </ScreeningContext.Provider>
  );
}

export function useScreening() {
  const context = useContext(ScreeningContext);
  if (!context) throw new Error('useScreening must be used within ScreeningProvider');
  return context;
}
