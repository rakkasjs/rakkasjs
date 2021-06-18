import { ErrorDescription } from "../dist";

export function toErrorDescription(error: any): ErrorDescription {
	const { message, status, stack, detail } = error ?? {};

	return {
		status: Number.isInteger(status) ? status : 500,
		message: typeof message === "string" ? message : "Unknown error",
		stack: typeof stack === "string" ? stack : undefined,
		detail,
	};
}
