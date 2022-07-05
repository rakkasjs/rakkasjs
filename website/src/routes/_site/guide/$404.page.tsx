import { Head } from "rakkasjs";

export default function GuidePageNotFound() {
	return (
		<div>
			<Head title="Page not found - Rakkas Guide" />
			<h1>Page not found</h1>
			<p>
				The guide article you are looking for does not exist. It may have been
				deleted or renamed. You can check out the menu on the left or use the
				search box to find what you are looking for.
			</p>
		</div>
	);
}
