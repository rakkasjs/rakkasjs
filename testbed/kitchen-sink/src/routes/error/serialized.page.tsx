import { useServerSideMutation } from "rakkasjs";

export default function SerializedErrorPage() {
	const { mutate, mutateAsync } = useServerSideMutation(() => {
		throw new Error("This error will be serialized");
	});

	return (
		<>
			<button
				onClick={async () => {
					const result = await mutateAsync();
				}}
			>
				Throw error
			</button>
		</>
	);
}
