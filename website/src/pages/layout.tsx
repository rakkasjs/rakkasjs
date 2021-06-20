import React from "react";
import { Layout, Link } from "rakkasjs";
import { Helmet } from "rakkasjs/helmet";
import "sanitize.css";
import "./global.css";
import { Header } from "$lib/Header";
import css from "./layout.module.css";
import { MDXProvider } from "@mdx-js/react";

const MainLayout: Layout = ({ error, children }) => (
	<>
		<Helmet>
			<html lang="en" />
			<title id="im-title">Rakkas</title>
		</Helmet>
		<Header />
		<main className={css.main}>
			{error ? (
				<pre>{error.stack || error.message}</pre>
			) : (
				<MDXProvider components={{ a: Link }}>{children}</MDXProvider>
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
