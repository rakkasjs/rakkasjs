import { Link, useHead, type Page } from "rakkasjs";

const HeadPage2: Page = () => {
	useHead({ title: "Head page 2" });

	return (
		<div>
			<p>Check my head tags!</p>
			<Link href="/head">Go to head test</Link>
		</div>
	);
};

export default HeadPage2;
