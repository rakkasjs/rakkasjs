import "rakkasjs";

declare module "*.module.css" {
	const styles: { [key: string]: string };
	export default styles;
}

declare module "rakkasjs" {
	interface RootContext {
		session: { user: null | { email: string } };
	}
}

declare global {
	interface Document {
		rakkasHydrate(): void;
		reloadFocusLayout(value: string): void;
	}
}
