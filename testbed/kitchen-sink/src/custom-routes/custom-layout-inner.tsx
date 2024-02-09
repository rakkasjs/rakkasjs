import { LayoutProps } from "rakkasjs";

export default function CustomLayoutInner({ children }: LayoutProps) {
	return (
		<>
			<h2>Custom Layout Inner</h2>
			{children}
		</>
	);
}
