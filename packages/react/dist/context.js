"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonPlaceholderProvider = JsonPlaceholderProvider;
exports.useJsonPlaceholderClient = useJsonPlaceholderClient;
exports.useJsonPlaceholderClientOptional = useJsonPlaceholderClientOptional;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// Context for the JsonPlaceholder client
const JsonPlaceholderContext = (0, react_1.createContext)(null);
// Provider component
function JsonPlaceholderProvider({ client, children }) {
    return ((0, jsx_runtime_1.jsx)(JsonPlaceholderContext.Provider, { value: client, children: children }));
}
// Hook to use the client
function useJsonPlaceholderClient() {
    const client = (0, react_1.useContext)(JsonPlaceholderContext);
    if (!client) {
        throw new Error('useJsonPlaceholderClient must be used within a JsonPlaceholderProvider. ' +
            'Wrap your app with <JsonPlaceholderProvider client={yourClient}>');
    }
    return client;
}
// Hook to check if client is available
function useJsonPlaceholderClientOptional() {
    return (0, react_1.useContext)(JsonPlaceholderContext);
}
//# sourceMappingURL=context.js.map