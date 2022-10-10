import {
	useQueryClient,
	useServerSideMutation,
	useServerSideQuery,
} from "rakkasjs";
import { ProductCard } from "./ProductCard";
import { products as productData } from "src/data/products";

export default function ProductList() {
	const { data: products } = useServerSideQuery(
		() => {
			return productData;
		},
		{ key: "products" },
	);

	const queryClient = useQueryClient();
	const addToCartMutation = useServerSideMutation(
		(ctx, id: string) => {
			const cart = new Set(ctx.session.data.cart);
			cart.add(id);
			ctx.session.data.cart = [...cart];
		},
		{
			onSuccess() {
				queryClient.invalidateQueries("session");
			},
		},
	);

	return (
		<div>
			{products.map((product) => (
				<ProductCard
					key={product.id}
					product={product}
					onAddToCart={(id) => addToCartMutation.mutate(id)}
				/>
			))}
		</div>
	);
}
