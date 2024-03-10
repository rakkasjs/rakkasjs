import { ReactNode, Suspense, useState } from "react";
import { StyledLink, StyledLinkProps, useLocation } from "rakkasjs";

export default function NavLayout({ children }: { children: ReactNode }) {
	const [clicked, setClicked] = useState(0);
	const { current: url } = useLocation();

	const scroll = url.searchParams.get("scroll");

	const linkProps: StyledLinkProps = {
		activeStyle: {
			fontWeight: "bold",
		},

		pendingStyle: {
			color: "red",
		},
	};

	return (
		<>
			<button onClick={() => setClicked((old) => old + 1)}>
				State test: {clicked}
			</button>

			<div
				style={url.searchParams.get("scroll") ? { height: "200vh" } : undefined}
			/>

			<nav>
				<ul>
					<li>
						<StyledLink
							{...linkProps}
							href={"/nav" + (scroll ? "?scroll=1" : "")}
						>
							Nav Home
						</StyledLink>
					</li>
					<li>
						<StyledLink
							{...linkProps}
							href={"/nav/a" + (scroll ? "?scroll=1" : "")}
						>
							Page A
						</StyledLink>
					</li>
					<li>
						<StyledLink
							{...linkProps}
							href={"/nav/b" + (scroll ? "?scroll=1" : "")}
						>
							Page B
						</StyledLink>
					</li>
					<li>
						<StyledLink
							{...linkProps}
							href={"/nav/b" + (scroll ? "?scroll=1" : "")}
							noScroll
						>
							Page B (no scroll)
						</StyledLink>
					</li>
					<li>
						<StyledLink
							{...linkProps}
							href={"/nav/c" + (scroll ? "?scroll=1" : "")}
						>
							Page C
						</StyledLink>
					</li>
				</ul>
			</nav>
			<Suspense fallback="Loading...">{children}</Suspense>
		</>
	);
}
