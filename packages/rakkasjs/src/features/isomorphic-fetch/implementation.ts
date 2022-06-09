import { createContext } from "react";

export const IsomorphicFetchContext = createContext<undefined | typeof fetch>(
	undefined,
);
