import {
	RakkasComponentProps,
	PageLoadResult,
	NavLink,
	LoadArgs,
} from "@rakkasjs/core";
import { PokemonList } from "pages/examples/pokemon/types";
import React, { FC, useEffect } from "react";
import css from "./index.module.css";

interface PokemonListPageProps extends RakkasComponentProps {
	data: { loadedPage: number; pokemons: PokemonList };
}

const PokemonListPage: FC<PokemonListPageProps> = ({
	children,
	params,
	data: { pokemons, loadedPage },
	url,
	useReload,
}) => {
	let page = Number(url.searchParams.get("p"));
	if (!Number.isInteger(page) || page < 0) {
		page = 0;
	}

	useReload({ deps: [page] });

	useEffect(() => {
		console.log("Mounted");

		return () => {
			console.log("Unmounted");
		};
	}, []);

	return (
		<div className={css.main}>
			<main className={css.content}>{children}</main>
			<aside className={css.sidebar}>
				<nav>
					<ul className={css.pokemons}>
						{pokemons.results.map((p) => (
							<li key={p.name}>
								<NavLink
									className={
										css.nameLink +
										(p.name === params.pokemon ? " " + css.activeLink : "")
									}
									nextRouteStyle={{ background: "#ccf" }}
									href={`/examples/pokemon/${p.name}?p=${loadedPage}`}
								>
									{p.name}
								</NavLink>
							</li>
						))}
					</ul>

					<p>
						{loadedPage * 10 + 1} - {loadedPage * 10 + pokemons.results.length}{" "}
						of {pokemons.count}
					</p>

					<div className={css.pagination}>
						{loadedPage > 0 ? (
							<NavLink
								nextRouteStyle={{ background: "#dde" }}
								href={`/examples/pokemon${
									params.pokemon ? "/" + params.pokemon : ""
								}?p=${loadedPage - 1}`}
							>
								&lt; Previous
							</NavLink>
						) : (
							<span />
						)}
						{loadedPage * 10 + 10 < pokemons.count && (
							<NavLink
								nextRouteStyle={{ background: "#dde" }}
								href={`/examples/pokemon${
									params.pokemon ? "/" + params.pokemon : ""
								}?p=${loadedPage + 1}`}
							>
								Next &gt;
							</NavLink>
						)}
					</div>
				</nav>
			</aside>
		</div>
	);
};

export default PokemonListPage;

export async function load({ url }: LoadArgs): Promise<PageLoadResult> {
	let page = Number(url.searchParams.get("p"));
	if (!Number.isInteger(page) || page < 0) {
		page = 0;
	}

	console.log("Loading page", page);

	const pokemons = await fetch(
		`https://pokeapi.co/api/v2/pokemon?limit=10&offset=${page * 10}`,
	).then((r) => r.json());

	return {
		data: {
			pokemons,
			loadedPage: page,
		},
	};
}
