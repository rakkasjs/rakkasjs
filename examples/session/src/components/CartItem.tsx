import css from "./CartItem.module.css";

export interface CartItemProps {
	id: string;
	name: string;
	price: number;
	onRemove: () => void;
}

export function CartItem({ id, name, price, onRemove }: CartItemProps) {
	return (
		<tr className={css.main}>
			<th>{name}</th>
			<td className={css.alignRight}>${price.toFixed(2)}</td>
			<td>
				<button onClick={onRemove} title={`Remove "${name}" from cart`}>
					×
				</button>
			</td>
		</tr>
	);
}
