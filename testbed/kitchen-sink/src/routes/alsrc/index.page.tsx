import { useQuery, runServerSideQuery, getRequestContext } from "rakkasjs";

export default function AlsRc() {
	const { data } = useQuery("alsrc", () => {
		try {
			const ctx = getRequestContext();
			return runServerSideQuery(ctx, () => {
				return "Success!";
			});
		} catch (error) {
			console.error(error);
			return "getRequestContext() failed";
		}
	});

	return <p>{data}</p>;
}
