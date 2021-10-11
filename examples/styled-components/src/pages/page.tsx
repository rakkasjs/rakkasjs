import React from "react";
import { Page } from "rakkasjs";
import styled from "styled-components";

const HomePage: Page = function HomePage() {
	return (
		<main>
			<p>
				Rakkas <ColoredText>Styled Components</ColoredText> example.
			</p>
		</main>
	);
};

const ColoredText = styled.span`
	color: #924;
`;

export default HomePage;
