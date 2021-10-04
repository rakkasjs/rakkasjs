import React from "react";
import { definePage, NavLink } from "rakkasjs";
import css from "./[pokemon].module.css";
import { Helmet } from "react-helmet-async";

export default definePage({
	async load({ params, fetch }) {
		// Fetch a pokemon from the Pokéapi
		// Notice that we're using the fetch function that was passed down to the load function
		// and not the global one!
		const data = await fetch(
			`https://pokeapi.co/api/v2/pokemon/${params.pokemon}`,
		).then((r) => r.json());

		return {
			data,
		};
	},

	// It's good practice to give components descriptive names
	Component: function PokemonStatPage({ data }) {
		return (
			<div className={css.wrapper}>
				<Helmet title="fetch Example - Rakkas" />
				<div className={css.title}>
					<nav>
						<ul className={css.links}>
							<NavLink
								href="/examples/fetch-define-page/pikachu"
								currentRouteClass={css.activeLink}
							>
								Pikachu
							</NavLink>
							<NavLink
								href="/examples/fetch-define-page/charizard"
								currentRouteClass={css.activeLink}
							>
								Charizard
							</NavLink>
							<NavLink
								href="/examples/fetch-define-page/onix"
								currentRouteClass={css.activeLink}
							>
								Onix
							</NavLink>
						</ul>
					</nav>

					<p style={{ minHeight: "182px" }}>
						<img
							src={data.sprites && data.sprites.front_default}
							className={css.image}
						/>
					</p>
				</div>

				<h3>Stats</h3>
				<ul className={css.stats}>
					{data.stats.map((s) => (
						<li className={css.stat} key={s.stat.name}>
							<h4>{s.stat.name}</h4>
							Base: {s.base_stat}
							<br />
							Effort: {s.effort}
						</li>
					))}
				</ul>
			</div>
		);
	},
});
