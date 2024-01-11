import { createContext } from "react";

export const RouteParamsContext = createContext<Record<string, string>>({});
