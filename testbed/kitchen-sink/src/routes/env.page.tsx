import { useServerSideQuery } from "rakkasjs";

export default function EnvPage() {
	const { data: env } = useServerSideQuery(() => ({ ...process.env }));

	return <pre>{JSON.stringify(env, null, 2)}</pre>;
}
