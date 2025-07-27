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
export interface UseMutationOptions<TData, TVariables> {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onMutate?: (variables: TVariables) => void | Promise<void>;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}
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
declare function useQuery<T>(queryKey: string, queryFn: () => Promise<T>, options?: UseQueryOptions<T>): UseQueryResult<T>;
declare function useMutation<TData, TVariables>(mutationFn: (variables: TVariables) => Promise<TData>, options?: UseMutationOptions<TData, TVariables>): UseMutationResult<TData, TVariables>;
export { useQuery, useMutation };
//# sourceMappingURL=hooks.d.ts.map