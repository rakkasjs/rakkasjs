import { createListener } from "@hattip/adapter-node";
import { hattipHandler } from "./hattip-handler";

export default createListener(hattipHandler);
