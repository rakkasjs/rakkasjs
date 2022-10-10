import { Head, useServerSideQuery } from "rakkasjs";
import { Cart } from "src/components/Cart";
import ProductList from "src/components/ProductList";

export default function HomePage() {
	return (
		<main>
			<Head title="Rakkas Store" />
			<ProductList />
			<Cart />
		</main>
	);
}
