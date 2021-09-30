declare module "*.module.css" {
	const styles: { [key: string]: string };
	export default styles;
}

interface Document {
	rakkasHydrate(): void;
}
