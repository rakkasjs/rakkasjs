import React, { useEffect } from "react";
import { Page } from "rakkasjs";
import styled from "styled-components";

const HomePage: Page = function HomePage() {
	useEffect(() => {
		document.body.classList.add("hydrated");
	});

	return (
		<main>
			<RedText>RED</RedText>
		</main>
	);
};

const RedText = styled.h1`
	color: red;
`;

export default HomePage;
