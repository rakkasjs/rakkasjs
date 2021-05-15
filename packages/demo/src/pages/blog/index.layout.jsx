import React from "react";

export default ({ children }) => (
	<>
		<p>
			This menu is defined in a nested layout. It's common to all /blog/* pages.
		</p>
		<nav>
			<ul>
				<li>What is Rakkas?</li>
				<li>Why another React framework?</li>
				<li>When will it be ready?</li>
			</ul>
		</nav>
		<hr />
		{children}
	</>
);
