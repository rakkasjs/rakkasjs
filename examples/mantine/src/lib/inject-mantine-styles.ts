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

async function* splitOnOpen(
	input: AsyncIterableIterator<Uint8Array>,
): AsyncIterableIterator<HtmlChunk> {
	let state: "data" | "open" | "other" = "data";
	const it = input[Symbol.asyncIterator]();
	const read = () =>
		it.next().catch(() => ({ done: true } as IteratorResult<Uint8Array>));

	let piece: IteratorResult<Uint8Array>;
	outer: while ((piece = await read())) {
		if (piece.done) {
			break;
		}
		let chunk = piece.value;

		let i = 0;
		let start = 0;
		inner: for (;;) {
			switch (state) {
				case "data":
					{
						const pos = chunk.indexOf(LESS_THAN, i);
						if (pos === -1) {
							yield { content: chunk.slice(start) };
							continue outer;
						}

						let char = chunk[pos + 1];
						let chunk2: Uint8Array | undefined;
						if (char === undefined) {
							// Bad luck, let's try again with more data
							let next: IteratorResult<Uint8Array>;
							do {
								next = await read();
								if (next.done) {
									yield { content: chunk.slice(start) };
									return;
								}
								chunk2 = next.value;
							} while (chunk2.length === 0);

							char = next.value[0];
						}

						if (isLetter(char)) {
							state = "open";
							yield { content: chunk.slice(start, pos) };
							yield "open";
							if (chunk2) {
								yield { content: new Uint8Array([LESS_THAN]) };
								i = 0;
								chunk = chunk2;
								start = 0;
							} else {
								i = pos + 1;
								start = pos;
							}
						} else if (
							char === EXCLAMATION_MARK ||
							char === SOLIDUS ||
							char === QUESTION_MARK
						) {
							if (chunk2) {
								yield { content: chunk.slice(start) };
								i = 0;
								chunk = chunk2;
								start = 0;
							} else {
								i = pos + 1;
							}
							state = "other";
							continue inner;
						} else {
							if (chunk2) {
								yield { content: chunk.slice(start) };
								i = 0;
								chunk = chunk2;
								start = 0;
							} else {
								i = pos + 1;
							}
							continue inner;
						}
					}
					break;

				case "open":
				case "other": {
					const pos = chunk.indexOf(GREATER_THAN, i);
					if (pos === -1) {
						yield { content: chunk.slice(start) };
						continue outer;
					}

					state = "data";
					i = pos + 1;
				}
			}
		}
	}
}

type HtmlChunk = { content: Uint8Array } | "open";

const FIRST_SCRIPT = `<script>function $ES(e){let i=e.previousSibling;i.remove(),document.head.appendChild(i),e.remove()}$ES(document.currentScript);</script>`;
const SCRIPT = `<script>$ES(document.currentScript);</script>`;

const LESS_THAN = 0x3c;
const GREATER_THAN = 0x3e;
const EXCLAMATION_MARK = 0x21; // EXCLAMATION MARK (!)
const SOLIDUS = 0x2f; // SOLIDUS (/)
const LATIN_CAPITAL_LETTER_A = 0x41; // LATIN CAPITAL LETTER A
const LATIN_CAPITAL_LETTER_Z = 0x5a; // LATIN CAPITAL LETTER Z
const LATIN_SMALL_LETTER_A = 0x61; // LATIN SMALL LETTER A
const LATIN_SMALL_LETTER_Z = 0x7a; // LATIN SMALL LETTER Z
const QUESTION_MARK = 0x3f; // QUESTION MARK (?)

function isLetter(char: number) {
	return (
		(char >= LATIN_CAPITAL_LETTER_A && char <= LATIN_CAPITAL_LETTER_Z) ||
		(char >= LATIN_SMALL_LETTER_A && char <= LATIN_SMALL_LETTER_Z)
	);
}
