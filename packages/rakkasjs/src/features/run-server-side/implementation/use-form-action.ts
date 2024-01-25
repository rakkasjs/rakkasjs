import { stringify } from "@brillout/json-serializer/stringify";
import { encodeFileNameSafe } from "../../../runtime/utils";
import { usePageContext } from "../../../lib";

export function useFormAction(desc: [callSiteId: string, closure: any[]]) {
	const { url } = usePageContext();

	const [callSiteId, closure] = desc;
	const stringified = closure.map((x) => stringify(x));

	let closurePath = stringified.map(encodeFileNameSafe).join("/");
	if (closurePath) closurePath = "/" + closurePath;

	const actionPath = callSiteId + closurePath;
	const actionUrl = new URL(url);
	actionUrl.searchParams.set("_action", actionPath);

	return actionUrl;
}
