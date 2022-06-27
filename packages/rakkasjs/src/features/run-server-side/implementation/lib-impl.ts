import { createContext } from "react";
import { ServerSideContext } from "../lib-common";

export const ServerSideContextImpl = createContext<ServerSideContext>(
	undefined as any,
);
