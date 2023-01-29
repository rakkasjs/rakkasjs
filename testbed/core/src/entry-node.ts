import { createMiddleware } from "@hattip/adapter-node";
import { requestHandler } from "./entry-hattip";

export default createMiddleware(requestHandler);
