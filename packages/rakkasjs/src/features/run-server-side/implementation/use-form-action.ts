import { stringify } from "@brillout/json-serializer/stringify";
import { encodeFileNameSafe } from "../../../runtime/utils";
import { useLocation } from "../../client-side-navigation/lib";

export function useFormAction(desc: [callSiteId: string, closure: any[]]) {
	const { current: url } = useLocation();

	const [callSiteId, closure] = desc;
	const stringified = closure.map((x) => stringify(x));

	let closurePath = stringified.map(encodeFileNameSafe).join("/");
	if (closurePath) closurePath = "/" + closurePath;

	const actionPath = callSiteId + closurePath;
	const actionUrl = new URL(url);
	actionUrl.searchParams.set("_action", actionPath);

	return actionUrl;
}
