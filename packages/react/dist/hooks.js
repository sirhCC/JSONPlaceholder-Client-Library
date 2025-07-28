"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQuery = useQuery;
exports.useMutation = useMutation;
const react_1 = require("react");
// Create a base query hook
function useQuery(queryKey, queryFn, options = {}) {
    const { enabled = true, suspense = false, refetchOnWindowFocus = false, refetchOnMount = true, staleTime = 0, cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 3, retryDelay = 1000, onSuccess, onError, initialData } = options;
    const [state, setState] = (0, react_1.useState)({
        data: initialData,
        error: null,
        isLoading: enabled && !initialData,
        isError: false,
        isSuccess: !!initialData,
        isIdle: !enabled,
        fetchStatus: 'idle'
    });
    const retryCountRef = (0, react_1.useRef)(0);
    const isMountedRef = (0, react_1.useRef)(true);
    const lastFetchTime = (0, react_1.useRef)(0);
    const executeQuery = (0, react_1.useCallback)(async () => {
        if (!enabled || !isMountedRef.current)
            return;
        // Check if data is still fresh
        const now = Date.now();
        const isStale = now - lastFetchTime.current > staleTime;
        if (state.data && !isStale && !refetchOnMount)
            return;
        setState(prev => ({
            ...prev,
            isLoading: !prev.data, // Don't show loading if we have cached data
            fetchStatus: 'fetching',
            isError: false,
            error: null
        }));
        try {
            const data = await queryFn();
            if (!isMountedRef.current)
                return;
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
        }
        catch (error) {
            if (!isMountedRef.current)
                return;
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
    const refetch = (0, react_1.useCallback)(async () => {
        retryCountRef.current = 0;
        lastFetchTime.current = 0; // Force refetch
        await executeQuery();
    }, [executeQuery]);
    // Execute query on mount and when dependencies change
    (0, react_1.useEffect)(() => {
        isMountedRef.current = true;
        executeQuery();
        return () => {
            isMountedRef.current = false;
        };
    }, [executeQuery]);
    // Handle window focus refetch
    (0, react_1.useEffect)(() => {
        if (!refetchOnWindowFocus)
            return;
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
    (0, react_1.useEffect)(() => {
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
function useMutation(mutationFn, options = {}) {
    const { onSuccess, onError, onMutate, onSettled } = options;
    const [state, setState] = (0, react_1.useState)({
        data: undefined,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: false,
        isIdle: true
    });
    const mutateAsync = (0, react_1.useCallback)(async (variables) => {
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
        }
        catch (error) {
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
    const mutate = (0, react_1.useCallback)(async (variables) => {
        try {
            return await mutateAsync(variables);
        }
        catch (error) {
            // Silently catch errors for fire-and-forget mutations
            console.error('Mutation error:', error);
            throw error;
        }
    }, [mutateAsync]);
    const reset = (0, react_1.useCallback)(() => {
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
//# sourceMappingURL=hooks.js.map