export {
	Link,
	NavLink,
	NavLinkProps,
	useRouter,
	RouterInfo,
	RouteRenderArgs,
	Router,
	RouterProps,
	ServerRouter,
} from "bare-routes";

import originalDevalue from "devalue";

export const devalue: (value: any) => string = originalDevalue;
