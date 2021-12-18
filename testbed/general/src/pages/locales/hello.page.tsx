import React, { ReactNode } from "react";
import { definePage, DefinePageTypes, Link } from "rakkasjs";

type LocalizePageTypes = DefinePageTypes<{ data: never }>;

export default definePage<LocalizePageTypes>({
	Component: function LocalizePage({ context }) {
		let rendered: ReactNode;
		if (context.locale === "fr") {
			rendered = <p>{context.locale}: Salut, le monde!</p>;
		} else {
			rendered = <p>{context.locale}: Hello, world!</p>;
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
