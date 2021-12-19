import React, { ReactNode } from "react";
import { definePage, DefinePageTypes, Link, useLocale } from "rakkasjs";

type LocalizePageTypes = DefinePageTypes<{ data: never }>;

export default definePage<LocalizePageTypes>({
	Component: function LocalizePage() {
		const locale = useLocale();

		let rendered: ReactNode;
		if (locale === "fr") {
			rendered = <p>{locale}: Salut, le monde!</p>;
		} else {
			rendered = <p>{locale}: Hello, world!</p>;
		}

		return (
			<div>
				{rendered}
				<nav>
					<ul>
						<li>
							<Link href="/locales/en/hello">English</Link>
						</li>
						<li>
							<Link href="/locales/fr/salut">Français</Link>
						</li>
					</ul>
				</nav>
			</div>
		);
	},
});
