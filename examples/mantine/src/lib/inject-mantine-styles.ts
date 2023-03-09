import { splitOnOpen } from "./split-html-stream";
import type { EmotionCache } from "@mantine/core";
import type { createStylesServer } from "@mantine/ssr";

type EmotionServer = ReturnType<typeof createStylesServer>;

export function injectStyles(
	stream: ReadableStream<Uint8Array>,
	cache: EmotionCache,
	server: EmotionServer,
): ReadableStream<Uint8Array> {
	const inserted = new Set<string>();
	const nonceString = cache.sheet.nonce;

	const split = splitOnOpen(stream as any);

	const { readable, writable } = new TransformStream({
		transform(chunk, controller) {
			controller.enqueue(chunk);
		},
	});

	async function go() {
		const writer = writable.getWriter();
		const decoder = new TextDecoder();
		const encoder = new TextEncoder();
		let text = "";
		let scriptInserted = false;

		for await (const chunk of split) {
			if (chunk === "open") {
				const regex = new RegExp(`(${cache.key}-[a-zA-Z0-9-_]+)`, "gm");
				let match: RegExpExecArray | null;
				const ids = new Set<string>();
				while ((match = regex.exec(text))) {
					if (!inserted.has(match[1])) {
						ids.add(match[1]);
						inserted.add(match[1]);
					}
				}

				// Fool the Emotion server into thinking we only have non-inserted styles
				const styles = server.extractCritical([...ids].join(" "));

				if (styles.css) {
					await writer.write(
						encoder.encode(
							`<style data-emotion="${cache.key}"${nonceString}>${styles.css}</style>`,
						),
					);

					if (!scriptInserted) {
						await writer.write(encoder.encode(FIRST_SCRIPT));
						scriptInserted = true;
					} else {
						await writer.write(encoder.encode(SCRIPT));
					}
				}

				await writer.write(encoder.encode(text));
				text = "";
			} else {
				text += decoder.decode(chunk.content);
			}
		}

		if (text) {
			await writer.write(encoder.encode(text));
		}

		await writer.close();
	}

	go().catch(() => {
		// Ignore
	});

	return readable;
}

const FIRST_SCRIPT = `<script>function $ES(e){let i=e.previousSibling;i.remove(),document.head.appendChild(i),e.remove()}$ES(document.currentScript);</script>`;
const SCRIPT = `<script>$ES(document.currentScript);</script>`;
