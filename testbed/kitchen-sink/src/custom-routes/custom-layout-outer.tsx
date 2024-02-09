import { LayoutProps } from "rakkasjs";

export default function CustomLayoutOuter({ children }: LayoutProps) {
	return (
		<>
			<h1>Custom Layout Outer</h1>
			{children}
		</>
	);
}
