import {
	Link,
	useQueryClient,
	useServerSideMutation,
	useServerSideQuery,
} from "rakkasjs";
import { CartItem } from "src/components/CartItem";
import { products } from "src/data/products";

export function Cart() {
	const { data: session } = useServerSideQuery(
		(ctx) => {
			const cart = ctx.session.data.cart
				.map((id) => products.find((p) => p.id === id)!)
				.filter(Boolean);

			return { userName: ctx.session.data.userName, cart };
		},
		{ queryKey: "session" },
	);

	const queryClient = useQueryClient();
	const remove = useServerSideMutation(
		(ctx, id: string) => {
			ctx.session.data.cart = ctx.session.data.cart.filter((i) => i !== id);
		},
		{
			onSuccess() {
				queryClient.invalidateQueries("session");
			},
		},
	);

	const signOut = useServerSideMutation(
		async (ctx) => {
			delete ctx.session.data.userName;
			// This doesn't do anything with stores that store session data in the
			// cookie itself, but it's necessary for other stores to regenerate the
			// session ID to prevent session fixation attacks.
			await ctx.session.regenerate();
		},
		{
			onSuccess() {
				queryClient.invalidateQueries("session");
			},
		},
	);

	return (
		<div>
			{session.userName ? (
				<div>
					<p>
						Hi <b>{session.userName}</b>!
					</p>
					<p>
						<button onClick={() => signOut.mutate()}>Sign out</button>
					</p>
				</div>
			) : (
				<p>
					<Link href="/sign-in">Sign in</Link> |{" "}
					<Link href="/sign-up">Sign up</Link>
				</p>
			)}

			{session.cart.length ? (
				<table>
					<tbody>
						{session.cart.map((product) => (
							<CartItem
								key={product.id}
								{...product}
								onRemove={() => {
									remove.mutate(product.id);
								}}
							/>
						))}
					</tbody>
				</table>
			) : (
				<div>Your cart is empty.</div>
			)}
		</div>
	);
}
