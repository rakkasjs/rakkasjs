import type { RequestContext } from "@hattip/compose";
import { createContext } from "react";
import { QueryContext } from "../lib";

export const IsomorphicContext = createContext<QueryContext>(undefined as any);

export const ServerSideContext = createContext<RequestContext>(
	undefined as any,
);
