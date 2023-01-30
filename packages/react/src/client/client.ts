import { createElement, ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";

export async function startClient() {
	const links = document.head.querySelectorAll(
		"link[data-route]",
	) as NodeListOf<HTMLLinkElement>;

	const modules = await Promise.all(
		[...links].map((link) => (0, eval)(`import(${JSON.stringify(link.href)})`)),
	);

	let app: ReactElement = createElement(
		modules[modules.length - 1].default,
		{},
	);

	for (let i = modules.length - 2; i >= 0; i--) {
		if (modules[i].default) {
			app = createElement(modules[i].default, {}, app);
		}
	}

	hydrateRoot(document.getElementById("root")!, app);
}
