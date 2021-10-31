import nodeFetch, {
	Response as NodeFetchResponse,
	Request as NodeFetchRequest,
	Headers as NodeFetchHeaders,
} from "node-fetch";

export function installNodeFetch() {
	(global as any).fetch = nodeFetch;
	(global as any).Response = NodeFetchResponse;
	(global as any).Request = NodeFetchRequest;
	(global as any).Headers = NodeFetchHeaders;
}
