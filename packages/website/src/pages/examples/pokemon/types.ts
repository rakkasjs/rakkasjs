export interface PokemonList {
	count: number;
	previous: string | null;
	next: string | null;
	results: PokemonSummary[];
}

export interface PokemonSummary {
	name: string;
	url: string;
}

export interface Pokemon {
	name: string;
	sprites?: {
		front_default: string;
	};
	stats: Array<{
		base_stat: number;
		effort: number;
		stat: {
			name: "hp";
		};
	}>;
}
