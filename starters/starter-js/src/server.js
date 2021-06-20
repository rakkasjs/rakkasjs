// setRootContext will run on the server and the return value will be passed as
// the context parameter to the load function of the outermost page or layout.
// You can use it to initalize session data that will be exposed to the client.
// You can, and probably will need to, return a promise.
// You may delete this file if you don't need a root context.
export function getRootContext() {
	return {};
}
