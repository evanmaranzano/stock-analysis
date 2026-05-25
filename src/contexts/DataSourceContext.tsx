import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { isMockMode, setMockMode as setApiMockMode, getDataSourceState } from '../api/client';

export type DataSourceState = 'live' | 'fallback' | 'cached' | 'mock' | 'offline';

interface DataSourceContextValue {
  state: DataSourceState;
  refreshState: () => void;
  mockMode: boolean;
  toggleMockMode: () => void;
}

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataSourceState>(isMockMode() ? 'mock' : 'live');
  const [mockMode, setMockModeState] = useState(isMockMode());

  const refreshState = useCallback(() => {
    if (mockMode) {
      setState('mock');
    } else {
      const s = getDataSourceState();
      setState(s === 'fallback' ? 'fallback' : s === 'mock' ? 'mock' : 'live');
    }
  }, [mockMode]);

  // Poll data source state after each render cycle
  useEffect(() => {
    refreshState();
  });

  const toggleMockMode = useCallback(() => {
    const next = !mockMode;
    setMockModeState(next);
    setApiMockMode(next);
    setState(next ? 'mock' : 'live');
  }, [mockMode]);

  return (
    <DataSourceContext.Provider value={{ state, refreshState, mockMode, toggleMockMode }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const ctx = useContext(DataSourceContext);
  if (!ctx) throw new Error('useDataSource must be used within DataSourceProvider');
  return ctx;
}
