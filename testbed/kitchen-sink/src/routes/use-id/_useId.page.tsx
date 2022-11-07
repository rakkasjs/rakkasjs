import { Page, useQuery } from "rakkasjs";
import { useId } from "react";

export let uniqueId: string;

const UseIdPage: Page = () => {
	const unique = useId();
	const serverResult = useQuery("id", () => unique);

	uniqueId = unique;

	return (
		<p id="useIdTestContainer">
			{unique === serverResult.data ? "Success" : "Fail"}
		</p>
	);
};

export default UseIdPage;
