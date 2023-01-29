export function GET() {
	return new Response(
		`<p>This is a shared header.</p>` + `<p>Hello world!</p>`,
		{ headers: { "Content-Type": "text/html" } },
	);
}
