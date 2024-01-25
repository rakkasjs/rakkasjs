import { createContext } from "react";

export const RouteParamsContext = createContext<Record<string, string>>({});

export const RenderedUrlContext = createContext<URL>(undefined as any);
