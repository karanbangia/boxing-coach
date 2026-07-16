import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  loadWorkoutHistoryForScope,
  type WorkoutHistoryItem,
} from '../lib/workoutHistory';
import { useAuth } from './AuthProvider';

interface WorkoutHistoryContextValue {
  history: WorkoutHistoryItem[];
  isReady: boolean;
  refreshHistory: () => Promise<void>;
}

const WorkoutHistoryContext = createContext<WorkoutHistoryContextValue | null>(null);

export function WorkoutHistoryProvider({ children }: PropsWithChildren) {
  const { user, isReady: authReady } = useAuth();
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const requestIdRef = useRef(0);
  const scopeId = user?.uid ?? null;

  const refreshHistory = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const items = await loadWorkoutHistoryForScope(scopeId);
    if (requestId !== requestIdRef.current) return;

    setHistory(Array.isArray(items) ? items : []);
    setIsReady(true);
  }, [scopeId]);

  useEffect(() => {
    requestIdRef.current += 1;

    if (!authReady) {
      setHistory([]);
      setIsReady(false);
      return;
    }

    setIsReady(false);
    void refreshHistory();
  }, [authReady, refreshHistory]);

  const value = useMemo<WorkoutHistoryContextValue>(() => ({
    history,
    isReady,
    refreshHistory,
  }), [history, isReady, refreshHistory]);

  return (
    <WorkoutHistoryContext.Provider value={value}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
}

export function useWorkoutHistory() {
  const value = useContext(WorkoutHistoryContext);
  if (!value) {
    throw new Error('useWorkoutHistory must be used inside WorkoutHistoryProvider.');
  }
  return value;
}
