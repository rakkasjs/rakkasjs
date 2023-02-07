import { useQuery, UseQueryOptions } from "rakkasjs";
import type { Session } from "@auth/core/types";

export function useAuthSession(options?: UseQueryOptions): Session {
	const { data } = useQuery<Session>(
		"auth:session",
		(ctx) => ctx.fetch("/auth/session").then((r) => r.json()),
		options,
	);

	return data;
}

export function useCsrf(options?: UseQueryOptions): string {
	const { data } = useQuery<{ csrfToken: string }>(
		"auth:csrf",
		(ctx) => ctx.fetch("/auth/csrf").then((r) => r.json()),
		options,
	);

	return data.csrfToken;
}
