import React, { forwardRef } from "react";
import { Layout, Link, useRouter } from "rakkasjs";
import { Helmet } from "react-helmet-async";
import { Header } from "../../lib/Header";
import css from "./layout.module.css";
import { MDXProvider } from "@mdx-js/react";
import "prism-themes/themes/prism-xonokai.css";

const MainLayout: Layout = ({ error, children }) => (
	<>
		<Helmet>
			<html lang="en" />
			<title>Rakkas</title>
		</Helmet>

		<Header />

		<div className={css.main}>
			{error ? (
				<pre>{error.stack || error.message}</pre>
			) : (
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
			)}
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
				(not affiliated). Used under{" "}
				<a href="https://creativecommons.org/licenses/by/2.0/">
					Creative Commons Attribution Generic license (CCBY)
				</a>
			</p>
		</footer>
	</>
);

export default MainLayout;

const MdxLink: typeof Link = forwardRef((props, ref) => {
	const { current } = useRouter();

	const url =
		props.href === undefined ? undefined : new URL(props.href, current);

	return (
		<Link
			target={url?.origin === current.origin ? undefined : "_blank"}
			{...props}
			ref={ref}
		/>
	);
});

MdxLink.displayName = "MdxLink";
