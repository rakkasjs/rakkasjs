import { Dispatch, SetStateAction } from "react";
import type { RootContext } from ".";
import { initClientGlobal, setGlobal } from "./lib/init-global";

export let setRootContext = initClientGlobal<
	Dispatch<SetStateAction<RootContext>>
>("rootContext", () => {
	throw new Error("setRootContext called outside of the render tree");
});

export function updateSetRootContext(
	setter: Dispatch<SetStateAction<RootContext>>,
) {
	setRootContext = setGlobal("rootContext", setter);
}
