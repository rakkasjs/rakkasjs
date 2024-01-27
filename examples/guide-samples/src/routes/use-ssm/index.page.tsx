import {
	Head,
	useQueryClient,
	useServerSideMutation,
	useServerSideQuery,
} from "rakkasjs";
import { useState } from "react";
import { getUserName, setUserName } from "./db";

export default function FormsPage() {
	const { data: currentUserName } = useServerSideQuery(() => getUserName(), {
		queryKey: "userName",
	});

	const [localUserName, setLocalUserName] = useState(currentUserName);

	const queryClient = useQueryClient();
	const mutation = useServerSideMutation(
		() => {
			setUserName(localUserName);
		},
		{
			onSuccess() {
				queryClient.invalidateQueries("userName");
			},
		},
	);

	return (
		<div>
			<Head title="useMutation example" />
			<h1>
				Hello <b>{currentUserName}</b>
			</h1>
			<p>
				<label>
					User name:
					<br />
					<input
						type="text"
						value={localUserName}
						onChange={(e) => setLocalUserName(e.target.value)}
					/>
				</label>
			</p>

			<p>
				<button
					type="button"
					onClick={() => {
						mutation.mutate();
					}}
				>
					Change user name
				</button>
			</p>
		</div>
	);
}
