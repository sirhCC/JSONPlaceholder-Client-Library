import React, { createContext, useContext, ReactNode } from 'react';
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

// Context for the JsonPlaceholder client
const JsonPlaceholderContext = createContext<JsonPlaceholderClient | null>(null);

// Provider component props
export interface JsonPlaceholderProviderProps {
  client: JsonPlaceholderClient;
  children: ReactNode;
}

// Provider component
export function JsonPlaceholderProvider({ client, children }: JsonPlaceholderProviderProps) {
  return (
    <JsonPlaceholderContext.Provider value={client}>
      {children}
    </JsonPlaceholderContext.Provider>
  );
}

// Hook to use the client
export function useJsonPlaceholderClient(): JsonPlaceholderClient {
  const client = useContext(JsonPlaceholderContext);
  
  if (!client) {
    throw new Error(
      'useJsonPlaceholderClient must be used within a JsonPlaceholderProvider. ' +
      'Wrap your app with <JsonPlaceholderProvider client={yourClient}>'
    );
  }
  
  return client;
}

// Hook to check if client is available
export function useJsonPlaceholderClientOptional(): JsonPlaceholderClient | null {
  return useContext(JsonPlaceholderContext);
}
