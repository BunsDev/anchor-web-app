import { produce } from 'immer';
import {
  Context,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Broadcasting, EventType, OperationResult, Subscriber } from './types';

export interface OperationBroadcasterProps {
  children: ReactNode;
}

export interface OperationBroadcasterState {
  // broadcast
  broadcast: (
    id: string,
    result: OperationResult<any, any>,
    rendering: ReactNode,
  ) => void;
  stopBroadcast: (id: string) => void;
  broadcasting: Broadcasting[];
  // events
  dispatch: (id: string, event: EventType) => void;
  subscribe: (subscriber: Subscriber) => () => void;
  // abort controllers
  getAbortController: (id: string) => AbortController | undefined;
  setAbortController: (id: string, abortController: AbortController) => void;
  removeAbortController: (id: string) => void;
}

// @ts-ignore
const OperationBroadcasterContext: Context<OperationBroadcasterState> = createContext<OperationBroadcasterState>();

export function OperationBroadcaster({ children }: OperationBroadcasterProps) {
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const subscribers = useRef<Set<Subscriber>>(new Set());

  const [broadcasting, setBroadcasting] = useState<Broadcasting[]>(() => []);

  const broadcast = useCallback(
    (id: string, result: OperationResult<any, any>, rendering: ReactNode) => {
      setBroadcasting((prev) => {
        const index = prev.findIndex((r) => r.id === id);

        return produce(prev, (draft) => {
          if (index > -1) {
            draft[index] = { id, result, rendering };
          } else {
            draft.push({ id, result, rendering });
          }
        });
      });
    },
    [],
  );

  const stopBroadcast = useCallback((id: string) => {
    setBroadcasting((prev) => {
      const index = prev.findIndex((r) => r.id === id);

      return index > -1
        ? produce(prev, (draft) => {
            draft.splice(index, 1);
          })
        : prev;
    });
  }, []);

  const subscribe = useCallback((subscriber: Subscriber) => {
    subscribers.current.add(subscriber);

    return () => {
      subscribers.current.delete(subscriber);
    };
  }, []);

  const dispatch = useCallback((id: string, event: EventType) => {
    for (const subscriber of subscribers.current) {
      subscriber(id, event);
    }
  }, []);

  const getAbortController = useCallback((id: string) => {
    return abortControllers.current.get(id);
  }, []);

  const setAbortController = useCallback(
    (id: string, abortController: AbortController) => {
      abortControllers.current.set(id, abortController);
    },
    [],
  );

  const removeAbortController = useCallback((id: string) => {
    abortControllers.current.delete(id);
  }, []);

  const state = useMemo<OperationBroadcasterState>(
    () => ({
      broadcast,
      stopBroadcast,
      broadcasting: broadcasting,
      subscribe,
      dispatch,
      getAbortController,
      setAbortController,
      removeAbortController,
    }),
    [
      broadcast,
      dispatch,
      getAbortController,
      removeAbortController,
      broadcasting,
      setAbortController,
      stopBroadcast,
      subscribe,
    ],
  );

  return (
    <OperationBroadcasterContext.Provider value={state}>
      {children}
    </OperationBroadcasterContext.Provider>
  );
}

export function useOperationBroadcaster(): OperationBroadcasterState {
  return useContext(OperationBroadcasterContext);
}
