import { useState, useEffect, useCallback, useRef } from 'react';
import { JsonPlaceholderClient, Post, Comment, User, PaginatedResponse } from 'jsonplaceholder-client-lib';

// Hook options interface
export interface UseQueryOptions<T> {
  enabled?: boolean;
  suspense?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
}

// Hook result interface
export interface UseQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  refetch: () => Promise<void>;
  fetchStatus: 'idle' | 'fetching' | 'paused';
}

// Mutation options interface
export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => void | Promise<void>;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

// Mutation result interface
export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  reset: () => void;
}

// Internal hook state
interface QueryState<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  fetchStatus: 'idle' | 'fetching' | 'paused';
}

// Create a base query hook
function useQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    suspense = false,
    refetchOnWindowFocus = false,
    refetchOnMount = true,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    initialData
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: initialData,
    error: null,
    isLoading: enabled && !initialData,
    isError: false,
    isSuccess: !!initialData,
    isIdle: !enabled,
    fetchStatus: 'idle'
  });

  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const lastFetchTime = useRef<number>(0);

  const executeQuery = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    // Check if data is still fresh
    const now = Date.now();
    const isStale = now - lastFetchTime.current > staleTime;
    if (state.data && !isStale && !refetchOnMount) return;

    setState(prev => ({
      ...prev,
      isLoading: !prev.data, // Don't show loading if we have cached data
      fetchStatus: 'fetching',
      isError: false,
      error: null
    }));

    try {
      const data = await queryFn();
      
      if (!isMountedRef.current) return;

      lastFetchTime.current = now;
      retryCountRef.current = 0;

      setState({
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isIdle: false,
        fetchStatus: 'idle'
      });

      onSuccess?.(data);
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorInstance = error instanceof Error ? error : new Error(String(error));
      
      // Retry logic
      const shouldRetry = typeof retry === 'boolean' ? retry : retryCountRef.current < retry;
      
      if (shouldRetry && retryCountRef.current < 10) { // Max 10 retries
        retryCountRef.current++;
        setTimeout(() => {
          if (isMountedRef.current) {
            executeQuery();
          }
        }, retryDelay * Math.pow(2, retryCountRef.current - 1)); // Exponential backoff
        return;
      }

      setState(prev => ({
        ...prev,
        error: errorInstance,
        isLoading: false,
        isError: true,
        isSuccess: false,
        fetchStatus: 'idle'
      }));

      onError?.(errorInstance);

      if (suspense) {
        throw errorInstance;
      }
    }
  }, [enabled, queryFn, staleTime, refetchOnMount, retry, retryDelay, onSuccess, onError, suspense, state.data]);

  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    lastFetchTime.current = 0; // Force refetch
    await executeQuery();
  }, [executeQuery]);

  // Execute query on mount and when dependencies change
  useEffect(() => {
    isMountedRef.current = true;
    executeQuery();

    return () => {
      isMountedRef.current = false;
    };
  }, [executeQuery]);

  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchOnWindowFocus, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refetch
  };
}

// Create a base mutation hook
function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, onMutate, onSettled } = options;

  const [state, setState] = useState<{
    data: TData | undefined;
    error: Error | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    isIdle: boolean;
  }>({
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    isIdle: true
  });

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    setState({
      data: undefined,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isIdle: false
    });

    try {
      await onMutate?.(variables);

      const data = await mutationFn(variables);

      setState({
        data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isIdle: false
      });

      onSuccess?.(data, variables);
      onSettled?.(data, null, variables);

      return data;
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));

      setState({
        data: undefined,
        error: errorInstance,
        isLoading: false,
        isError: true,
        isSuccess: false,
        isIdle: false
      });

      onError?.(errorInstance, variables);
      onSettled?.(undefined, errorInstance, variables);

      throw errorInstance;
    }
  }, [mutationFn, onMutate, onSuccess, onError, onSettled]);

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      return await mutateAsync(variables);
    } catch (error) {
      // Silently catch errors for fire-and-forget mutations
      console.error('Mutation error:', error);
      throw error;
    }
  }, [mutateAsync]);

  const reset = useCallback(() => {
    setState({
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isIdle: true
    });
  }, []);

  return {
    ...state,
    mutate,
    mutateAsync,
    reset
  };
}

export { useQuery, useMutation };
