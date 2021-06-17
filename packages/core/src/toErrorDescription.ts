import { ErrorDescription } from "../dist";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toErrorDescription(error: any): ErrorDescription {
	const { message, status, stack, detail } = error ?? {};

	return {
		status: Number.isInteger(status) ? status : 500,
		message: typeof message === "string" ? message : "Unknown error",
		stack: typeof stack === "string" ? stack : undefined,
		detail,
	};
}
