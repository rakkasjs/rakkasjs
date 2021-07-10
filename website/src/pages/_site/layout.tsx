import React from "react";
import { Layout, Link } from "rakkasjs";
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
			<meta property="og:title" content="Rakkas - the dancing web framework" />
			<meta property="og:url" content="https://rakkasjs.org" />
			<meta property="og:type" content="website" />
			<meta property="og:image" content="https://rakkasjs.org/og-image.png" />
			<meta property="og:image:width" content="582" />
			<meta property="og:image:height" content="278" />
		</Helmet>

		<Header />

		<main className={css.main}>
			{error ? (
				<pre>{error.stack || error.message}</pre>
			) : (
				<MDXProvider
					components={{
						a: Link,
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
		</main>

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
