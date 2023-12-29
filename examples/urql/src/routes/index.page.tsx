import { useQuery } from "urql";

const QUERY = `
  query Starship($id: ID!) {
    starship(id: $id) {
      name
      crew
      passengers
    }
  }
`;

export default function HomePage() {
	return (
		<main>
			<h1>Hello world!</h1>
			<Starship id="c3RhcnNoaXBzOjEw" />
			<Starship id="c3RhcnNoaXBzOjk=" />
		</main>
	);
}

function Starship(props: { id: string }) {
	const [result] = useQuery({ query: QUERY, variables: { id: props.id } });
	return <pre>{JSON.stringify(result.data, null, 2)}</pre>;
}
