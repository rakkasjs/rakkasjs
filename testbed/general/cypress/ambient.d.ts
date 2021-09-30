declare const process: {
	env: Record<string, string | undefined>;
};

interface Document {
	rakkasHydrate(): void;
	reloadFocusLayout(value: string): void;
}
