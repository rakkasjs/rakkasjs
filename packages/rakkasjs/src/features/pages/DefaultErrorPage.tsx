import React, { useEffect } from "react";
import { FallbackProps } from "react-error-boundary";

export function DefaultErrorPage(props: FallbackProps) {
	useEffect(() => {
		// Set title
		document.title = "Internal Error";
	}, []);

	const message =
		typeof props.error?.stack === "string"
			? props.error.stack
			: typeof props.error?.message === "string"
				? props.error.message
				: typeof props.error === "string"
					? props.error
					: undefined;

	return import.meta.env.DEV ? (
		<>
			<h1>Internal Error</h1>
			<p>
				This is Rakkas&apos;s default error page. It will{" "}
				<b>not be available</b> when you build your application for production
				and a bare “Internal Error” message will be displayed instead.
			</p>
			<p>
				Use <code>ErrorBoundary</code> to catch errors and create a{" "}
				<code>$error.jsx</code> in your <code>routes</code> directory to provide
				a last resort error page.
			</p>
			{message && (
				<>
					<h2>Error message</h2>
					<pre>{message}</pre>
				</>
			)}
			<p>
				<button type="button" onClick={() => location.reload()}>
					Retry
				</button>
			</p>
		</>
	) : (
		<>
			<h1>Internal Error</h1>
		</>
	);
}
