import { PageProps } from "rakkasjs";

export default function CanRauPage(props: PageProps<{ canrau: string }>) {
	return <h1>Can Rau's user: {props.params.canrau}</h1>;
}
