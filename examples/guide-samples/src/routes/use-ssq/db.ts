const data = {
	pikachu: {
		sprites: {
			front_default:
				"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
		},
		stats: [
			{
				stat: {
					name: "hp",
				},
				base_stat: 35,
				effort: 0,
			},
			{
				stat: {
					name: "attack",
				},
				base_stat: 55,
				effort: 0,
			},
			{
				stat: {
					name: "defense",
				},
				base_stat: 40,
				effort: 0,
			},
			{
				stat: {
					name: "special-attack",
				},
				base_stat: 50,
				effort: 0,
			},
			{
				stat: {
					name: "special-defense",
				},
				base_stat: 50,
				effort: 0,
			},
			{
				stat: {
					name: "speed",
				},
				base_stat: 90,
				effort: 2,
			},
		],
	},

	charizard: {
		sprites: {
			front_default:
				"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
		},
		stats: [
			{
				stat: {
					name: "hp",
				},
				base_stat: 78,
				effort: 0,
			},
			{
				stat: {
					name: "attack",
				},
				base_stat: 84,
				effort: 0,
			},
			{
				stat: {
					name: "defense",
				},
				base_stat: 78,
				effort: 0,
			},
			{
				stat: {
					name: "special-attack",
				},
				base_stat: 109,
				effort: 3,
			},
			{
				stat: {
					name: "special-defense",
				},
				base_stat: 85,
				effort: 0,
			},
			{
				stat: {
					name: "speed",
				},
				base_stat: 100,
				effort: 0,
			},
		],
	},

	onix: {
		sprites: {
			front_default:
				"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/95.png",
		},
		stats: [
			{
				stat: {
					name: "hp",
				},
				base_stat: 35,
				effort: 0,
			},
			{
				stat: {
					name: "attack",
				},
				base_stat: 45,
				effort: 0,
			},
			{
				stat: {
					name: "defense",
				},
				base_stat: 160,
				effort: 1,
			},
			{
				stat: {
					name: "special-attack",
				},
				base_stat: 30,
				effort: 0,
			},
			{
				stat: {
					name: "special-defense",
				},
				base_stat: 45,
				effort: 0,
			},
			{
				stat: {
					name: "speed",
				},
				base_stat: 70,
				effort: 0,
			},
		],
	},
};

export default {
	pokemon: {
		findOne: async (name: string) => {
			return data[name as keyof typeof data] || null;
		},
	},
};
