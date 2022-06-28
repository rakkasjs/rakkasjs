import type { AdapterRequestContext } from "@hattip/core";
import { createContext } from "react";
import { QueryContext } from "../lib";

export const IsomorphicContext = createContext<QueryContext>(undefined as any);

export const ServerSideContext = createContext<AdapterRequestContext>(
	undefined as any,
);
