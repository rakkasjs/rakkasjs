import styled from "@emotion/styled";

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
