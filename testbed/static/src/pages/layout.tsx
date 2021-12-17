import React from "react";
import { defineLayout, DefineLayoutTypes, StyledLink } from "rakkasjs";
import { Helmet } from "react-helmet-async";

export type MainLayoutTypes = DefineLayoutTypes<{
	data: { people: Array<{ id: number; fullName: string }> };
}>;

export default defineLayout<MainLayoutTypes>({
	async load({ fetch }) {
		const result: MainLayoutTypes["data"] = await fetch(
			"/api/people.json",
		).then((r) => {
			if (!r.ok) throw new Error(`/api/people returned status ${r.status}`);

			return r.json();
		});

		return { data: result };
	},

	Component: function MainLayout({ data, error, children }) {
		const helmet = <Helmet titleTemplate="%s - Fake People" />;

		if (error) {
			return (
				<>
					{helmet}
					<h1>{error.message}</h1>
				</>
			);
		}

		return (
			<div>
				{helmet}
				<main>
					<h1>Fake People</h1>
					{children}
				</main>
				<nav>
					<ul>
						<li>
							<StyledLink href="/" activeStyle={{ fontWeight: "bold" }}>
								Home
							</StyledLink>
						</li>

						<li>
							People
							<ul>
								{data?.people.map((p) => (
									<li key={p.id}>
										<StyledLink
											href={`/profile/${p.id}`}
											activeStyle={{ fontWeight: "bold" }}
										>
											{p.fullName}
										</StyledLink>
									</li>
								))}
							</ul>
						</li>
					</ul>
				</nav>
			</div>
		);
	},
});
