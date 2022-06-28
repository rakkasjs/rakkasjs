import React from "react";
import { Head } from "../head/lib";

export function Default404Page() {
	return import.meta.env.DEV ? (
		<>
			<Head title="Not Found" />
			<h1>Not Found</h1>
			<p>
				This is Rakkas&apos;s default 404 page. It will <b>not be available</b>{" "}
				when you build your application for production and a bare “Not Found”
				message will be displayed instead.
			</p>
			<p>
				Create a <code>$404.page.jsx</code> in your <code>routes</code>{" "}
				directory to provide a custom 404 page.
			</p>
		</>
	) : (
		<>
			<Head title="Not Found" />
			<h1>Not Found</h1>
		</>
	);
}
