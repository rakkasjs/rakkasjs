import { Logomark } from "./Logomark";
import { Logotype } from "./Logotype";
import { Link, StyledLink, useLocation, ClientSide } from "rakkasjs";
import React, { FC, useEffect, useRef, useState } from "react";
import css from "./Header.module.css";
import { GithubLogo } from "$lib/GithubLogo";
import { Squash as Hamburger } from "hamburger-react";
import { HomeIcon } from "$lib/HomeIcon";
import { GuidIcon } from "$lib/GuideIcon";
import { ExternalIcon } from "$lib/ExternalIcon";
import { BlogIcon } from "$lib/BlogIcon";
import { Toc } from "./Toc";
import { toc as guideToc } from "../pages/_site/guide/toc";
import { toc as blogToc } from "../routes/_site/blog/toc";
import { DocSearch } from "@docsearch/react";
import "@docsearch/css";

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
	const currentUrl = new URL(current);

	// Close on navigation
	useEffect(() => {
		if (isOpen) setIsOpen(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUrl.href]);

	const nav = (
		<nav>
			<ul>
				<li>
					<StyledLink
						href="/"
						activeClass={css.activeLink}
						pendingClass={css.nextLink}
					>
						<span className={css.icon}>
							<HomeIcon />
						</span>{" "}
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
						<span className={css.icon}>
							<GuidIcon />
						</span>{" "}
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
						<span className={css.icon}>
							<BlogIcon />
						</span>{" "}
						Blog
					</StyledLink>
				</li>
				<li>
					<a
						href="https://github.com/rakkasjs/rakkasjs"
						target="_blank"
						rel="noreferrer"
						title="Github"
					>
						<span className={css.icon}>
							<GithubLogo />
						</span>{" "}
						GitHub
						<ExternalIcon />
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

			<span className={css.nav}>{nav}</span>

			<ClientSide fallback={<span className={css.docSearchPlaceholder} />}>
				<DocSearch
					appId="Q8E33NN7EC"
					apiKey="ea3307404701ddce0c61b918c2fee8d4"
					indexName="rakkasjs"
				/>
			</ClientSide>

			<aside
				className={css.sidebar + (isOpen ? " " + css.open : "")}
				ref={sidebarRef}
			>
				{nav}
				{currentUrl.pathname.startsWith("/guide") && (
					<>
						<hr />
						<Toc toc={guideToc} />
					</>
				)}
				{currentUrl.pathname.startsWith("/blog") && (
					<>
						<hr />
						<Toc toc={blogToc} />
					</>
				)}
			</aside>
		</header>
	);
};
