import type { Session } from "@auth/core/types";
import { LayoutProps, Link, StyledLink, useLocation } from "rakkasjs";
import { useAuthSession, useCsrf } from "src/lib/auth";

export default function MainLayout({ children }: LayoutProps) {
	const session = useAuthSession({
		refetchInterval: 15_000,
		refetchOnReconnect: true,
		refetchOnWindowFocus: true,
	});

	return (
		<>
			<header
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					minHeight: "3em",
				}}
			>
				<Nav />
				{session?.user ? <LoggedIn user={session?.user} /> : <LoggedOut />}
			</header>
			<hr />
			<main>{children}</main>
		</>
	);
}

function Nav() {
	return (
		<nav>
			<StyledLink href="/" activeStyle={{ fontWeight: "bold" }}>
				Home
			</StyledLink>{" "}
			|{" "}
			<StyledLink href="/guarded" activeStyle={{ fontWeight: "bold" }}>
				Guarded
			</StyledLink>
		</nav>
	);
}

function LoggedIn({ user }: { user: NonNullable<Session["user"]> }) {
	const { current: url } = useLocation();

	const signoutUrl = new URL("/auth/signout", url);
	signoutUrl.searchParams.set("callbackUrl", new URL("/", url).href);

	const csrf = useCsrf({
		refetchInterval: 15_000,
		refetchOnReconnect: true,
		refetchOnWindowFocus: true,
	});

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "1em",
				justifyContent: "flex-end",
				minHeight: "3em",
			}}
		>
			<span>{user.name}</span>
			<form action={signoutUrl.href} method="post">
				<input type="hidden" name="csrfToken" value={csrf} />
				<button type="submit">Sign out</button>
			</form>
			<img
				src={user.image || undefined}
				alt={`${user.name}'s avatar`}
				width="32"
				height="32"
				style={{ borderRadius: "50%" }}
			/>
		</div>
	);
}

function LoggedOut() {
	const { current: url } = useLocation();

	const signinUrl = new URL("/auth/signin", url);
	signinUrl.searchParams.set("callbackUrl", url.href);

	return <a href={signinUrl.href}>Sign in</a>;
}
