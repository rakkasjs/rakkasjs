import { Logomark } from "./Logomark";
import { Logotype } from "./Logotype";
import { Link, StyledLink, useLocation, ClientOnly } from "rakkasjs";
import { FC, useEffect, useRef, useState } from "react";
import css from "./Header.module.css";
import { Squash as Hamburger } from "hamburger-react";
import { Toc } from "./Toc";
import { toc as guideToc } from "../routes/_site/guide/toc";
import { toc as blogToc } from "../routes/_site/blog/toc";
import * as DocSearchAll from "@docsearch/react";
import "@docsearch/css";

const DocSearch: typeof DocSearchAll.DocSearch =
	"default" in DocSearchAll
		? (DocSearchAll as any).default.DocSearch
		: DocSearchAll.DocSearch;

export const Header: FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const burgerRef = useRef<HTMLSpanElement>(null);
	const sidebarRef = useRef<HTMLDivElement>(null);

	// Close on outside click and escape
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				sidebarRef.current &&
				!sidebarRef.current.contains(event.target as Node) &&
				burgerRef.current &&
				!burgerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [sidebarRef]);

	const { current } = useLocation();

	// Close on navigation
	useEffect(() => {
		if (isOpen) setIsOpen(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [current.href]);

	const nav = (
		<nav className={css.nav}>
			<ul>
				<li>
					<StyledLink
						href="/"
						activeClass={css.activeLink}
						pendingClass={css.nextLink}
					>
						Home
					</StyledLink>
				</li>
				<li>
					<StyledLink
						href="/guide"
						activeClass={css.activeLink}
						pendingClass={css.nextLink}
						onCompareUrls={(url) => url.pathname.startsWith("/guide")}
					>
						Guide
					</StyledLink>
				</li>
				<li>
					<StyledLink
						href="/blog"
						activeClass={css.activeLink}
						pendingClass={css.nextLink}
						onCompareUrls={(url) => url.pathname.startsWith("/blog")}
					>
						Blog
					</StyledLink>
				</li>
				<li>
					<a href="/chat" title="Chat" target="_blank" rel="noreferrer">
						Chat
					</a>
				</li>
				<li>
					<a
						href="https://github.com/rakkasjs/rakkasjs"
						target="_blank"
						rel="noreferrer"
						title="Github"
					>
						GitHub
					</a>
				</li>
			</ul>
		</nav>
	);

	return (
		<header className={css.main}>
			<span className={css.burger} ref={burgerRef}>
				<Hamburger
					color="#924"
					toggled={isOpen}
					toggle={(x) => {
						setIsOpen(x);
					}}
					duration={0.2}
				/>
			</span>

			<span className={css.logoContainer}>
				<Link className={css.logo} href="/">
					<Logomark height="40px" />
					<Logotype height="40px" />
				</Link>
			</span>

			<span className={css.topNav}>{nav}</span>

			<ClientOnly fallback={<span className={css.docSearchPlaceholder} />}>
				<DocSearch
					appId="Q8E33NN7EC"
					apiKey="ea3307404701ddce0c61b918c2fee8d4"
					indexName="rakkasjs"
				/>
			</ClientOnly>

			<aside
				className={css.sidebar + (isOpen ? " " + css.open : "")}
				ref={sidebarRef}
			>
				{nav}
				{current.pathname.startsWith("/guide") && (
					<>
						<hr />
						<Toc toc={guideToc} />
					</>
				)}
				{current.pathname.startsWith("/blog") && (
					<>
						<hr />
						<Toc toc={blogToc} />
					</>
				)}
			</aside>
		</header>
	);
};
