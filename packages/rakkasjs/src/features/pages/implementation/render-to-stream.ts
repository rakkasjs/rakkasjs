import { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server.browser";

export interface PageRenderingContext {
	page: ReactNode;
	scriptPath: string;
	abortSignal: AbortSignal;
	throttle: boolean | number;
}

export async function renderToStream(
	options: PageRenderingContext,
): Promise<ReadableStream> {
	const { page, scriptPath, abortSignal, throttle } = options;
	let error: any;
	let errorOccurred = false;

	abortSignal.addEventListener("abort", () => {
		reactStream.cancel();
	});

	const reactStream = await renderToReadableStream(page, {
		// TODO: AbortController
		bootstrapModules: [scriptPath!],
		onError(err) {
			error = err;
			errorOccurred = true;
		},
	});

	if (throttle === true) {
		await reactStream.allReady;
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 0);
		});
	} else if (throttle > 0) {
		await Promise.race([
			reactStream.allReady,
			new Promise<void>((resolve) => {
				setTimeout(resolve, throttle as number);
			}),
		]);
	}

	if (errorOccurred) {
		throw error;
	}

	return reactStream;
}
