import { createRequestHandler } from "rakkasjs/server";
import { cookie } from "@hattip/cookie";
import { session, EncryptedCookieStore } from "@hattip/session";

const base64Key = process.env.SECRET_SESSION_KEY;

if (!base64Key) {
	console.error(
		"Please set the SECRET_SESSION_KEY environment variable. " +
			"You can generate a random key with `node scripts/generate-key` " +
			"and put it in a .env file.",
	);
	throw new Error("Missing environment variable SECRET_SESSION_KEY");
}

// Use commas to add more keys to support key rotation
const keys = await EncryptedCookieStore.generateKeysFromBase64(
	base64Key.split(",") as [string, ...string[]],
);

// Declare session data type
declare module "@hattip/session" {
	interface SessionData {
		userName?: string;
		cart: string[];
	}
}

export default createRequestHandler({
	middleware: {
		beforeAll: [
			cookie(),
			session({
				store: new EncryptedCookieStore(keys),
				defaultSessionData: {
					cart: [],
				},
				cookieOptions: {
					httpOnly: true,
					secure: import.meta.env.PROD,
					path: "/",
					maxAge: 60 * 60 * 1000, // 1 week
				},
			}),
		],
	},
});
