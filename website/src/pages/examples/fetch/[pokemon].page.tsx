import React from "react";
import { definePage, DefinePageTypes, NavLink } from "rakkasjs";
import css from "./[pokemon].module.css";
import { Helmet } from "react-helmet-async";

// DefinePageTypes helper type helps you define the types used in this page
type PokemonStatPageTypes = DefinePageTypes<{
	// Path parameters
	params: { pokemon: string };

	// Type of the loaded data, we'll just define the bits we actually use
	data: {
		sprites?: { front_default?: string };
		stats: Array<{
			stat: { name: string };
			base_stat: number;
			effort: number;
		}>;
	};
}>;

export default definePage<PokemonStatPageTypes>({
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

	// Component: ({ data }) => <div> ... </div> could also work but
	// giving your components a descriptive name is always a good idea
	// for debugging.
	Component: function PokemonStatPage({ data }) {
		return (
			<div className={css.wrapper}>
				<Helmet title="fetch Example - Rakkas" />
				<div className={css.title}>
					<nav>
						<ul className={css.links}>
							<NavLink
								href="/examples/fetch/pikachu"
								activeClass={css.activeLink}
							>
								Pikachu
							</NavLink>
							<NavLink
								href="/examples/fetch/charizard"
								activeClass={css.activeLink}
							>
								Charizard
							</NavLink>
							<NavLink href="/examples/fetch/onix" activeClass={css.activeLink}>
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
