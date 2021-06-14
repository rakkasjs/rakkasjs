import { createContext } from "react";

export interface HeadContent {
	title?: string;
}

export const HeadContext = createContext<HeadContent>({ title: "Rakkas App" });
