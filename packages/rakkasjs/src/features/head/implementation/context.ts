import { createNamedContext } from "../../../runtime/named-context";
import { HeadProps } from "./types";

export const HeadContext = createNamedContext<{ stack: HeadProps[] }>(
	"ServerHeadContext",
	{ stack: [] },
);
