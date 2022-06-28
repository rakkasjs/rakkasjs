import { createContext } from "react";
import { QueryContext } from "../lib";

export const IsomorphicContext = createContext<QueryContext>(undefined as any);
