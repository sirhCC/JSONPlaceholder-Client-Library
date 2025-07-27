import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
// Context for the JsonPlaceholder client
const JsonPlaceholderContext = createContext(null);
// Provider component
export function JsonPlaceholderProvider({ client, children }) {
    return (_jsx(JsonPlaceholderContext.Provider, { value: client, children: children }));
}
// Hook to use the client
export function useJsonPlaceholderClient() {
    const client = useContext(JsonPlaceholderContext);
    if (!client) {
        throw new Error('useJsonPlaceholderClient must be used within a JsonPlaceholderProvider. ' +
            'Wrap your app with <JsonPlaceholderProvider client={yourClient}>');
    }
    return client;
}
// Hook to check if client is available
export function useJsonPlaceholderClientOptional() {
    return useContext(JsonPlaceholderContext);
}
//# sourceMappingURL=context.js.map