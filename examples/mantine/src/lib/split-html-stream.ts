/** Split an HTML stream into chunks on open tag boundaries. */
export async function* splitOnOpen(
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

export type HtmlChunk = { content: Uint8Array } | "open";

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
