import React from "react";
import { definePage, PageTypes } from "rakkasjs";
import css from "./[pokemon].module.css";
import { Pokemon } from "pages/examples/pokemon/types";

interface Types extends PageTypes {
	params: {
		pokemon: string;
	};
	data: Pokemon;
}

export default definePage<Types>({
	render({ data }) {
		return (
			<>
				<div className={css.title}>
					<h2>{data.name}</h2>
					<p style={{ minHeight: "182px" }}>
						<img src={data.sprites?.front_default} style={{ zoom: 2 }} />
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
			</>
		);
	},

	getCacheKey: ({ params }) => params.pokemon,

	load: async ({ params }) => {
		const data = await fetch(
			`https://pokeapi.co/api/v2/pokemon/${params.pokemon}`,
		).then((r) => r.json());

		return {
			data,
		};
	},
});
