import { ReactNode } from 'react';
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
export interface JsonPlaceholderProviderProps {
    client: JsonPlaceholderClient;
    children: ReactNode;
}
export declare function JsonPlaceholderProvider({ client, children }: JsonPlaceholderProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useJsonPlaceholderClient(): JsonPlaceholderClient;
export declare function useJsonPlaceholderClientOptional(): JsonPlaceholderClient | null;
//# sourceMappingURL=context.d.ts.map