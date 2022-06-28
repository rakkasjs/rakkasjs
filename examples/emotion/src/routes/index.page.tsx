import styled from "@emotion/styled";
import { createContext, useContext } from "react";
import z from "zod";

const StyledParagraph = styled.p({
	color: "green",
});

export default function EmotionExample() {
	return (
		<>
			<h1 css={{ color: "red" }}>Hello world!</h1>
			<StyledParagraph>Hello world!</StyledParagraph>
		</>
	);
}
