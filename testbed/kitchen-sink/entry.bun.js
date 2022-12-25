import bunAdapter from "@hattip/adapter-bun";
import handler from "./dist/server/hattip.js";
import url from "url";
import path from "path";

const dir = path.resolve(
	path.dirname(url.fileURLToPath(new URL(import.meta.url))),
	"dist/client",
);

export default bunAdapter(handler, { staticDir: dir });
