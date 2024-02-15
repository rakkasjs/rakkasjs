import { Link, useNavigationBlocker } from "rakkasjs";
import { useState } from "react";

export default function Blocker() {
	const [text, setText] = useState("");
	const blocker = useNavigationBlocker(text.trim() !== "");

	return (
		<div>
			<p>
				<input
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
				&nbsp;
				<button onClick={() => setText("")}>Clear</button>
			</p>
			<p>
				<Link href="/blocker/elsewhere">Go elsewhere</Link>
			</p>
			{blocker.isBlocking && (
				<>
					<p>
						You have unsaved changes. Are you sure you want to leave this page?
					</p>
					<p>
						<button id="leave" onClick={blocker.leave}>
							Yes, leave
						</button>
						&nbsp;
						<button id="stay" onClick={blocker.stay}>
							No, stay
						</button>
					</p>
				</>
			)}
		</div>
	);
}
