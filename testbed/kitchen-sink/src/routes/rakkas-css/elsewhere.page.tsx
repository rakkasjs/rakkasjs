import { Link, Page } from "rakkasjs";
import { css } from "@rakkasjs/css";

const RakkasCssElsewherePage: Page = () => {
	return (
		<>
			<h1 className={css({ color: "red" })}>Rakkas CSS Test</h1>
			<p>
				<Link href="/rakkas-css">Back to the main Rakkas CSS test</Link>
			</p>
		</>
	);
};

export default RakkasCssElsewherePage;
