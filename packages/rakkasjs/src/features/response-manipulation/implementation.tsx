/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, {
	createContext,
	ReactElement,
	useContext,
	useLayoutEffect,
} from "react";
import { navigate } from "../client-side-navigation/lib";
import { escapeJson } from "../../runtime/utils";
import type { CommonHooks, PreloadFunction } from "../../lib";

/** {@link Redirect} props */
export interface RedirectProps {
	/** The URL to redirect to */
	href: string;
	/** Whether the redirect is permanent @default false */
	permanent?: boolean;
	/** The status code to use (hes precedence over `permanent`) */
	status?: number;
}

// @ts-ignore
/**
 * Component for redirecting the user to a different URL. Handling redirections
 * in {@link CommonHooks.beforePageLookup beforePageLookup hook} or in the
 * {@link PreloadFunction preload function} function results in better SEO so
 * it's recommended over using this component.
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
			useLayoutEffect(() => {
				navigate(props.href, { replace: true });
			});

			return null as any;
	  };

/** {@link ResponseHeader} props */
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

// @ts-ignore
/**
 * Component for setting response status, respnse headers, and throttling the
 * SSR stream. Exporting a {@link HeadersFunction headers()} function from your
 * pages or layouts usually works better for SEO and is recommended over this
 * component.
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

export const ResponseContext = createContext<
	(props: ResponseContextProps) => void
>(() => undefined);
