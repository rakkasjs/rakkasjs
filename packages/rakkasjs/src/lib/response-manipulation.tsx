/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, {
	createContext,
	ReactElement,
	useContext,
	useLayoutEffect,
} from "react";
import { navigate } from "../runtime/client-side-navigation";
import { escapeJson } from "../runtime/utils";

export interface RedirectProps {
	/** The URL to redirect to */
	href: string;
	/** Whether the redirect is permanent */
	permanent?: boolean;
	/** The status code to use (hes precedence over `permanent`) */
	status?: number;
}

// @ts-ignore
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
							__html: `window.location.href=${escapeJson(props.href)};`,
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

export interface ResponseHeadersProps {
	/** Status code */
	status?: number;
	/** The headers to set */
	headers?: Record<string, string | string[]>;
}

// @ts-ignore
export const ResponseHeaders = import.meta.env.SSR
	? function ResponseHeaders(props: ResponseHeadersProps): ReactElement {
			const response = useContext(ResponseContext);

			response({ status: props.status, headers: props.headers });

			return <></>;
	  }
	: // eslint-disable-next-line @typescript-eslint/no-unused-vars
	  function ResponseHeaders(props: ResponseHeadersProps): ReactElement {
			return null as any;
	  };

export interface ResponseContextProps {
	redirect?: boolean;
	status?: number;
	headers?: Record<string, string | string[]>;
}

export const ResponseContext = createContext<
	(props: ResponseContextProps) => void
>(() => undefined);
