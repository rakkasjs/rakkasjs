/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, {
	type ReactElement,
	useContext,
	useLayoutEffect,
	useRef,
} from "react";
import { navigate } from "../client-side-navigation/lib";
import { escapeJson } from "../../runtime/utils";
import type { CommonHooks, PreloadFunction } from "../../lib";
import { createNamedContext } from "../../runtime/named-context";

/** {@link Redirect} props */
export interface RedirectProps {
	/** The URL to redirect to */
	href: string;
	/** Whether the redirect is permanent @default false */
	permanent?: boolean;
	/** The status code to use (hes precedence over `permanent`) */
	status?: number;
}

/**
 * Component for redirecting the user to a different URL.
 *
 * Note that if this component is deep inside a suspense boundary, it won't
 * be able to return a redirect response after the response stream has started
 * and it will attempt to redirect from the client using JavaScript. If
 * JavaScript is disabled, the redirect won't work in this case. For this
 * reason, either use this component at the top level of your page or layout,
 * or use the {@link PreloadFunction} to redirect before the response stream
 * starts.
 */
export const Redirect = import.meta.env.SSR
	? function Redirect(props: RedirectProps): ReactElement {
			const redirect = useContext(ResponseContext);

			redirect({
				redirect: true,
				status: props.status || (props.permanent ? 301 : 302),
				headers: { location: props.href },
			});

			// TODO: Document that if <Redirect /> is burried deep in a suspense boundary and JavaScript is disabled, it won't work.

			return (
				<>
					<script
						dangerouslySetInnerHTML={{
							__html: `window.location.href=${escapeJson(
								JSON.stringify(props.href),
							)};`,
						}}
					/>
				</>
			);
		}
	: function Redirect(props: RedirectProps): ReactElement {
			const redirected = useRef(false);

			useLayoutEffect(() => {
				if (redirected.current) return;
				redirected.current = true;
				navigate(props.href, { replace: true }).catch(() => {
					// Ignore
				});
			});

			return null as any;
		};

/** {@link ResponseHeaders} props */
export interface ResponseHeadersProps {
	/** Status code */
	status?: number | ((currentStatus: number) => number);
	/** The headers to set */
	headers?: Record<string, string | string[]> | ((headers: Headers) => void);
	/**
	 * Time to hold the render stream before returning the response. Set to
	 * true to hold until the page is fully rendered, effectively disabling
	 * streaming.
	 */
	throttleRenderStream?: number | true;
}

/**
 * Component for setting response status, respnse headers, and throttling the
 * SSR stream.
 *
 * Note that if this component is deep inside a suspense boundary, it won't
 * be able to set the response headers after the response stream has started.
 * Rakkas disables streaming for bots, so this is usually not a problem for
 * SEO. But if you want to be absolutely sure that the headers are set, you
 * can export a {@link HeadersFunction headers()} function from your page
 * or layout to set the headers.
 */
export const ResponseHeaders = import.meta.env.SSR
	? function ResponseHeaders(props: ResponseHeadersProps): ReactElement {
			const response = useContext(ResponseContext);

			response({
				status: props.status,
				headers: props.headers,
				throttleRenderStream: props.throttleRenderStream,
			});

			return <></>;
		}
	: // eslint-disable-next-line @typescript-eslint/no-unused-vars
		function ResponseHeaders(props: ResponseHeadersProps): ReactElement {
			return null as any;
		};

export interface ResponseContextProps {
	redirect?: boolean;
	status?: number | ((currentStatus: number) => number);
	headers?: Record<string, string | string[]> | ((headers: Headers) => void);
	throttleRenderStream?: number | true;
}

export const ResponseContext = createNamedContext<
	(props: ResponseContextProps) => void
>("ResponseContext", () => undefined);
