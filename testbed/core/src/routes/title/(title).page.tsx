export default function TitlePage() {
	return <p>This page has a title</p>;
}

export function preload() {
	return { head: { title: "Page title" } };
}
