import { LoadArgs, RakkasComponentProps, PageLoadResult } from "@rakkasjs/core";
import { Pokemon } from "pages/examples/pokemon/types";
import React, { FC } from "react";
import css from "./[pokemon].module.css";

interface PokemonPageProps extends RakkasComponentProps {
	params: {
		pokemon: string;
	};
	data: Pokemon;
}

const PokemonPage: FC<PokemonPageProps> = ({ params, data, useReload }) => {
	useReload({ deps: [params.pokemon] });

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
};

export default PokemonPage;

interface PokemonLoadArgs extends LoadArgs {
	params: {
		pokemon: string;
	};
}

export async function load({
	params,
}: PokemonLoadArgs): Promise<PageLoadResult> {
	const data = await fetch(
		`https://pokeapi.co/api/v2/pokemon/${params.pokemon}`,
	).then((r) => r.json());

	return {
		data,
	};
}
