import React, { forwardRef } from "react";
import { Layout, Link, useLocation, Head } from "rakkasjs";
import { Header } from "lib/Header";
import css from "./layout.module.css";
import { MDXProvider } from "@mdx-js/react";
import "prism-themes/themes/prism-xonokai.css";
import { ExternalIcon } from "lib/ExternalIcon";

// TODO: Handle errors

const MainLayout: Layout = ({ children }) => (
	<>
		<Head>
			<html lang="en" />
			<title>Rakkas</title>
		</Head>

		<Header />

		<div className={css.main}>
			<MDXProvider
				components={{
					// TODO: Typing problem
					// @ts-expect-error: To fix
					a: MdxLink,
					// eslint-disable-next-line react/display-name
					table: (props) => (
						<div className={css.tableWrapper}>
							<table {...props} />
						</div>
					),
				}}
			>
				{children}
			</MDXProvider>
		</div>

		<footer className={css.footer}>
			<p>
				Software and documentation: Copyright {new Date().getFullYear()} Fatih Aygün. MIT License.
			</p>

			<p>
				Logomark: “Flamenco” by{" "}
				<a href="https://thenounproject.com/term/flamenco/111303/">
					gzz from Noun Project
				</a>{" "}
				(not affiliated).
			</p>
		</footer>
	</>
);

export default MainLayout;

const MdxLink: typeof Link = forwardRef(({ children, ...props }, ref) => {
	const { current } = useLocation();

	const url =
		props.href === undefined ? undefined : new URL(props.href, current);

	return (
		<Link
			target={!url || url.origin === current.origin ? undefined : "_blank"}
			{...props}
			ref={ref}
		>
			{children}
			{!url || url?.origin === current.origin || <ExternalIcon />}
		</Link>
	);
});

MdxLink.displayName = "MdxLink";
