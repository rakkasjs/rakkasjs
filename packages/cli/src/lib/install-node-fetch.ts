import nodeFetch, {
	Response as NodeFetchResponse,
	Request as NodeFetchRequest,
	Headers as NodeFetchHeaders,
} from "node-fetch";

export function installNodeFetch() {
	(globalThis as any).fetch = nodeFetch;
	(globalThis as any).Response = NodeFetchResponse;
	(globalThis as any).Request = NodeFetchRequest;
	(globalThis as any).Headers = NodeFetchHeaders;
}
