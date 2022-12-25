import type { Session } from "@auth/core/types";
import { usePageContext, useQuery } from "rakkasjs";

export default function HomePage() {
	const ctx = usePageContext();
	const {
		data: { session, csrfToken },
	} = useQuery(
		"session",
		async () => {
			const [session, token]: [Session, { csrfToken: string }] =
				await Promise.all([
					// ctx.fetch allows us to make credentialed requests during SSR
					ctx.fetch("/auth/session").then((r) => r.json()),
					ctx.fetch("/auth/csrf").then((r) => r.json()),
				]);

			return { session, csrfToken: token.csrfToken };
		},
		{
			refetchInterval: 10_000,
			refetchOnReconnect: true,
			refetchOnWindowFocus: true,
		},
	);

	if (session.user) {
		return (
			<main>
				<h1>Hello {session.user.name}!</h1>
				{session.user.image && (
					<p>
						<img
							src={session.user.image}
							alt={`${session.user.name}'s avatar`}
							width="48"
						/>
					</p>
				)}
				<p>Your email is {session.user.email}.</p>

				<form action="/auth/signout" method="post">
					<input type="hidden" name="csrfToken" value={csrfToken} />
					<button type="submit">Sign out</button>
				</form>
			</main>
		);
	}

	return (
		<main>
			<h1>You're not signed in</h1>
			<p>
				<a href="/auth/signin">Sign in</a>
			</p>
		</main>
	);
}
