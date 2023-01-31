import { ComponentType, createElement, ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";

export async function startClient() {
	const links = document.head.querySelectorAll(
		"link[data-route]",
	) as NodeListOf<HTMLLinkElement>;

	const [params, meta, ...data] = window.$RAKKAS_DATA;

	const modules: ClientModule[] = await Promise.all(
		[...links].map((link) => (0, eval)(`import(${JSON.stringify(link.href)})`)),
	);

	let app: ReactElement = createElement(modules[modules.length - 1].default, {
		params,
		meta,
		data: data[data.length - 1],
	});

	for (let i = modules.length - 2; i >= 0; i--) {
		if (modules[i].default) {
			app = createElement(
				modules[i].default,
				{
					params,
					meta,
					data: data[i],
				},
				app,
			);
		}
	}

	hydrateRoot(document.getElementById("root")!, app);
}

interface ClientModule {
	default: ComponentType<ClientComponentProps>;
}

interface ClientComponentProps {
	params: Record<string, string>;
	meta: Record<string, unknown>;
	data: unknown;
}

declare global {
	// eslint-disable-next-line no-var
	var $RAKKAS_DATA: [
		Record<string, string>,
		Record<string, unknown>,
		...unknown[],
	];
}
