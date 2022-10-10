import type { Product } from "src/data/products";
import css from "./ProductCard.module.css";

export interface ProductCardProps {
	product: Product;
	onAddToCart: (id: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
	return (
		<div className={css.main}>
			<h2>{product.name}</h2>

			<div className={css.photoWrapper}>
				<img
					className={css.photo}
					src={"/product-images/" + product.photo}
					alt={product.name}
				/>
			</div>

			<div className={css.controls}>
				<span>${product.price.toFixed(2)}</span>
				<button onClick={() => onAddToCart(product.id)}>Add to cart</button>
			</div>
		</div>
	);
}
