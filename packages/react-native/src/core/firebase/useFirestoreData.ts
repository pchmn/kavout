import { hashQueryKey, QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { UseFirestoreOptions } from './types';

const unsubscribes: Record<string, () => void> = {};
const observersCount: Record<string, number> = {};

export function useFirestoreData<T>(
  queryKey: QueryKey,
  fetchFn: () => Promise<T>,
  subscribeFn: (onData: (data: T) => void, onError?: (error: Error) => void) => () => void,
  options?: UseFirestoreOptions<T>
) {
  const { listen = true, initialData, enabled = true } = options || {};
  const queryKeyHash = hashQueryKey(queryKey);
  const previousQueryKeyHash = useRef<string>(queryKeyHash);

  const queryClient = useQueryClient();

  const unsubscribe = (key: string) => {
    if (observersCount[key] === 1) {
      unsubscribes[key]?.();
      delete unsubscribes[key];
    }
    observersCount[key] += -1;
  };

  useEffect(() => {
    if (listen) {
      observersCount[queryKeyHash] = observersCount[queryKeyHash] ? observersCount[queryKeyHash] + 1 : 1;
    }

    if (previousQueryKeyHash.current && previousQueryKeyHash.current !== queryKeyHash) {
      unsubscribe(previousQueryKeyHash.current);
      previousQueryKeyHash.current = queryKeyHash;
    }

    return () => unsubscribe(queryKeyHash);
  }, [listen, queryKeyHash]);

  const {
    data = initialData,
    isLoading,
    fetchStatus,
    ...others
  } = useQuery<T, Error>(
    queryKey,
    async () => {
      if (listen) {
        let resolved = false;

        return new Promise<T>((resolve, reject) => {
          unsubscribes[queryKeyHash] = subscribeFn((data) => {
            if (!resolved) {
              resolved = true;
              return resolve(data);
            }
            queryClient.setQueryData<T>(queryKey, data);
          }, reject);
        });
      }
      return fetchFn();
    },
    {
      enabled,
      keepPreviousData: enabled,
      staleTime: Infinity,
      retry: false,
      refetchInterval: undefined,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  return { data, isLoading: isLoading && fetchStatus !== 'idle', fetchStatus, ...others };
}
