import { LayoutTypes, NavLink, defineLayout } from "rakkasjs";
import { PokemonList } from "pages/examples/pokemon/types";
import React from "react";
import css from "./index.module.css";

interface Types extends LayoutTypes {
	data: PokemonList;
}

export default defineLayout<Types>({
	render({ children, data, params, url }) {
		const page = parsePageNumber(url.searchParams);

		return (
			<div className={css.main}>
				<main className={css.content}>{children}</main>
				<aside className={css.sidebar}>
					<nav>
						<ul className={css.pokemons}>
							{data.results.map((p) => (
								<li key={p.name}>
									<NavLink
										className={
											css.nameLink +
											(p.name === params.pokemon ? " " + css.activeLink : "")
										}
										nextRouteStyle={{ background: "#ccf" }}
										href={`/examples/pokemon/${p.name}?p=${page}`}
									>
										{p.name}
									</NavLink>
								</li>
							))}
						</ul>

						<p>
							{page * 10 + 1} - {page * 10 + data.results.length} of{" "}
							{data.count}
						</p>

						<div className={css.pagination}>
							{page > 0 ? (
								<NavLink
									nextRouteStyle={{ background: "#dde" }}
									href={`/examples/pokemon${
										params.pokemon ? "/" + params.pokemon : ""
									}?p=${page - 1}`}
								>
									&lt; Previous
								</NavLink>
							) : (
								<span />
							)}
							{page * 10 + 10 < data.count && (
								<NavLink
									nextRouteStyle={{ background: "#dde" }}
									href={`/examples/pokemon${
										params.pokemon ? "/" + params.pokemon : ""
									}?p=${page + 1}`}
								>
									Next &gt;
								</NavLink>
							)}
						</div>
					</nav>
				</aside>
			</div>
		);
	},

	getCacheKey({ url }): unknown {
		return parsePageNumber(url.searchParams);
	},

	async load({ context, url }) {
		console.log("Context is", context);

		const page = parsePageNumber(url.searchParams);

		console.log("Loading page", page);

		const data = await fetch(
			`https://pokeapi.co/api/v2/pokemon?limit=10&offset=${page * 10}`,
		).then((r) => r.json());

		return {
			data,
		};
	},

	options: {
		canHandleErrors: false,
	},
});

function parsePageNumber(searchParams: URLSearchParams) {
	let page = Number(searchParams.get("p"));
	if (!Number.isInteger(page) || page < 0) {
		page = 0;
	}

	return page;
}
