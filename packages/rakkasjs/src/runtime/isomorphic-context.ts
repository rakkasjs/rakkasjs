import type { RequestContext } from "@hattip/compose";
import type { PageContext } from "../lib";
import { createNamedContext } from "./named-context";

export const IsomorphicContext = createNamedContext<PageContext>(
	"IsomorphicContext",
	undefined as any,
);

export const ServerSideContext = createNamedContext<RequestContext | undefined>(
	"ServerSideContext",
	undefined,
);
