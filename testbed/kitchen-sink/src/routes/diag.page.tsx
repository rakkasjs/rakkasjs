import { useServerSideQuery } from "rakkasjs";

export default function EnvPage() {
	const { data } = useServerSideQuery((ctx) => ({
		url: ctx.url.href,
		headers: Object.fromEntries(ctx.request.headers.entries()),
		env: { ...process.env },
	}));

	return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
