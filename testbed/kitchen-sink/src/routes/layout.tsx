import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<header>This is a shared header.</header>
			<hr />
			{children}
			<hr />
			<footer>This is a shared footer.</footer>
		</>
	);
}
