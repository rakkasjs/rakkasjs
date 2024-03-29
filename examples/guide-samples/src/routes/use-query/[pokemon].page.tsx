import { Head, StyledLink, PageProps, useQuery } from "rakkasjs";
import css from "./[pokemon].module.css";

// Types for the dynamic route params
interface Params {
	pokemon: string;
}

// Type for the Pokéapi data, just the bits we actually use
interface Pokemon {
	sprites?: { front_default?: string };
	stats: Array<{
		stat: { name: string };
		base_stat: number;
		effort: number;
	}>;
}

export default function PokemonStatPage({ params }: PageProps<Params>) {
	// Unique key for the data to be fetched
	const key = `pokemon:${params.pokemon}`;

	const { data } = useQuery(key, async (ctx) => {
		// Fetch pokémon data from the Pokéapi
		const pokemon: Pokemon = await ctx
			.fetch(`https://pokeapi.co/api/v2/pokemon/${params.pokemon}`)
			.then((r) => {
				if (!r.ok) throw new Error(r.statusText);
				return r.json();
			});

		// Pokéapi returns a lot of data, we only need the sprite and stats.
		// Let's pluck it to avoid unnecessary data serialization in case this
		// is a server-side render.
		return {
			sprites: {
				front_default: pokemon.sprites?.front_default,
			},
			stats: pokemon.stats.map((stat) => ({
				stat: { name: stat.stat.name },
				base_stat: stat.base_stat,
				effort: stat.effort,
			})),
		};
	});

	return (
		<div className={css.wrapper}>
			<Head title={`${params.pokemon} stats`} />
			<div className={css.title}>
				<nav>
					<ul className={css.links}>
						<StyledLink href="/use-query/pikachu" activeClass={css.activeLink}>
							Pikachu
						</StyledLink>
						<StyledLink
							href="/use-query/charizard"
							activeClass={css.activeLink}
						>
							Charizard
						</StyledLink>
						<StyledLink href="/use-query/onix" activeClass={css.activeLink}>
							Onix
						</StyledLink>
					</ul>
				</nav>

				<p>
					<img
						src={data.sprites && data.sprites.front_default}
						className={css.image}
						height={96}
					/>
				</p>
			</div>

			<h3 className={css.heading}>Stats</h3>
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
}
