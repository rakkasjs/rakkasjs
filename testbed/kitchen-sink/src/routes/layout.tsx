import { ReactNode, useEffect } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
	useEffect(() => {
		document.body.classList.add("hydrated");
	});

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
