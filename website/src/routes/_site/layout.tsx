import React, { forwardRef } from "react";
import { Layout, Link, useLocation, Head } from "rakkasjs";
import { Header } from "$lib/Header";
import css from "./layout.module.css";
import { MDXProvider } from "@mdx-js/react";
import "prism-themes/themes/prism-xonokai.css";
import { ExternalIcon } from "$lib/ExternalIcon";

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
				Software and documentation: Copyright 2021 Fatih Aygün. MIT License.
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
	const currentUrl = new URL(current);

	const url =
		props.href === undefined ? undefined : new URL(props.href, currentUrl);

	return (
		<Link
			target={url?.origin === currentUrl.origin ? undefined : "_blank"}
			{...props}
			ref={ref}
		>
			{children}
			{url?.origin === currentUrl.origin || <ExternalIcon />}
		</Link>
	);
});

MdxLink.displayName = "MdxLink";
