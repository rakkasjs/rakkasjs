import styled from "@emotion/styled";
import { createContext, useContext } from "react";
import z from "zod";

const StyledParagraph = styled.p({
	color: "green",
});

export default function EmotionExample() {
	return (
		<>
			<h1 css={{ color: "red" }}>Hello world!</h1>
			<StyledParagraph>Hello world!</StyledParagraph>
		</>
	);
}

// FIXME: Remove these

export function createSSQ<T extends Tuple, R>(
	validator: Validator<T>,
	handler: Handler<T, R>,
): (...args: T) => Promise<Unpromisify<R>> {
	return async function (...args) {
		const validated = await validator(args);
		return handler(...validated) as any;
	};
}

type Validator<T extends Tuple> = (args: Tuple) => T | Promise<T>;

type Handler<T extends Tuple, R> = (...args: T) => R;

type Unpromisify<T> = T extends Promise<infer U> ? U : T;

type Tuple =
	| []
	| [unknown]
	| [unknown, unknown]
	| [unknown, unknown, unknown]
	| [unknown, unknown, unknown, unknown]
	| [unknown, unknown, unknown, unknown, unknown]
	| [unknown, unknown, unknown, unknown, unknown, unknown]
	| [unknown, unknown, unknown, unknown, unknown, unknown, unknown]
	| [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]
	| [
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
	  ]
	| [
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
			unknown,
	  ]
	| unknown[];

export const ssq = createSSQ(z.tuple([z.number(), z.number()]).parse, (a, b) =>
	Promise.resolve(Promise.resolve(Promise.resolve(Promise.resolve(a + b)))),
);

export const xxx = ssq(1, 2);

declare const SERVER_SIDE_CONTEXT: unique symbol;

export type ServerSideContext = {
	[SERVER_SIDE_CONTEXT]: true;
};

interface ActualServerSideContext {
	request: Request;
}

const ServerSideContext = createContext<ActualServerSideContext | undefined>(
	undefined,
);

export function useServerSideContext(): ServerSideContext {
	if (import.meta.env.SSR) {
		return useContext(ServerSideContext) as any;
	} else {
		return undefined as any;
	}
}

export function runServerSide(
	context: ServerSideContext,
	fn: (context: ActualServerSideContext) => any,
) {}

type User = `/user/${number}/name/${string}`;

const x: User = "/user/123/name/cyco";

type Stringable = string | number;

// Escape URL paths for string template literal
export function url(template: TemplateStringsArray, id: number, name: string) {
	return template.reduce(
		(acc, part, i) =>
			acc +
			part +
			(i < args.length ? encodeURIComponent(args[i].toString()) : ""),
		"",
	);
}

url`/user/${123}/name/${456}`;
