export interface Product {
	id: string;
	name: string;
	price: number;
	photo: string;
	photoCredit: {
		name: string;
		userName: string;
	};
}

export const products: Product[] = [
	{
		id: "1",
		name: "T-shirt",
		price: 20,
		photo: "tshirt.jpg",
		photoCredit: {
			name: "Anomaly",
			userName: "anomaly",
		},
	},
	{
		id: "2",
		name: "Socks",
		price: 10,
		photo: "socks.jpg",
		photoCredit: {
			name: "Gabrielle Henderson",
			userName: "gabriellefaithhenderson",
		},
	},
	{
		id: "3",
		name: "Hoodie",
		price: 30,
		photo: "hoodie.jpg",
		photoCredit: {
			name: "The Ian",
			userName: "theian",
		},
	},
	{
		id: "4",
		name: "Cap",
		price: 15,
		photo: "cap.jpg",
		photoCredit: {
			name: "Angel Monsanto III",
			userName: "angelmonsanto_raw",
		},
	},
	{
		id: "5",
		name: "Jacket",
		price: 40,
		photo: "jacket.jpg",
		photoCredit: {
			name: "Caio Coelho",
			userName: "smokthebikini",
		},
	},
];

/*
Photo by <a href="https://unsplash.com/@anomaly?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Anomaly</a> on <a href="https://unsplash.com/s/photos/t-shirt?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
Photo by <a href="https://unsplash.com/@gabriellefaithhenderson?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Gabrielle Henderson</a> on <a href="https://unsplash.com/s/photos/socks?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
Photo by <a href="https://unsplash.com/es/@theian20?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">The Ian</a> on <a href="https://unsplash.com/s/photos/hoodie?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
Photo by <a href="https://unsplash.com/@angelmonsanto_raw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Angel Monsanto III</a> on <a href="https://unsplash.com/s/photos/cap?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
Photo by <a href="https://unsplash.com/@smokthebikini?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Caio Coelho</a> on <a href="https://unsplash.com/s/photos/jacket?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
*/
