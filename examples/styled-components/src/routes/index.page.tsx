import styled from "styled-components";

const Button = styled.button`
	background-color: #04f;
	color: white;
	border: none;
	padding: 1em 2em;
`;

export default function HomePage() {
	return (
		<main>
			<h1>Hello world!</h1>
			<Button>I'm a styled button!</Button>
		</main>
	);
}
