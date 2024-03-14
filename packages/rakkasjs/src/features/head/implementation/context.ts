import { createNamedContext } from "../../../runtime/named-context";
import { type HeadProps } from "./types";

export const HeadContext = createNamedContext<{ stack: HeadProps[] }>(
	"ServerHeadContext",
	{ stack: [] },
);
