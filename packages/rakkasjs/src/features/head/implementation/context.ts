import { createNamedContext } from "../../../runtime/named-context";
import { NormalizedHeadProps } from "./merge";

export const HeadContext = createNamedContext<NormalizedHeadProps>(
	"ServerHeadContext",
	{ keyed: {}, unkeyed: [] },
);
