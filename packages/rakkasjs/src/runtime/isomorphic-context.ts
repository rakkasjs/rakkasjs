import type { RequestContext } from "@hattip/compose";
import { createContext } from "react";
import { PageContext } from "../lib";

export const IsomorphicContext = createContext<PageContext>(undefined as any);

export const ServerSideContext = createContext<RequestContext | undefined>(
	undefined,
);
