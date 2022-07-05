import { Head } from "rakkasjs";

export default function BlogPageNotFound() {
	return (
		<div>
			<Head title="Page not found - Rakkas Blog" />
			<h1>Page not found</h1>
			<p>
				The blog post you are looking for does not exist. It may have been
				deleted or renamed. You can check out the menu on the left or use the
				search box to find what you are looking for.
			</p>
		</div>
	);
}
