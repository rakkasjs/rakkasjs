import { ResponseHeadersProps } from "rakkasjs";

export function headers(): ResponseHeadersProps {
	return { throttleRenderStream: true };
}
