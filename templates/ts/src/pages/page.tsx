import React from "react";
import { Page } from "rakkasjs";

const HomePage: Page = function HomePage() {
	return (
		<main>
			<h1>Hello world!</h1>
			<p>Welcome to Rakkas.JS demo page.</p>
			<p>
				Try editing <code>src/pages/page.jsx</code> or{" "}
				<code>src/pages/layout.jsx</code> to get started or go to the{" "}
				<a href="https://rakkas.cyco130.com" target="_blank" rel="noreferrer">
					website
				</a>
				.
			</p>
			<p>
				You may also check the little <a href="/todo">TODO application</a> to
				learn about API endpoints and data fetching.
			</p>
		</main>
	);
};

export default HomePage;
