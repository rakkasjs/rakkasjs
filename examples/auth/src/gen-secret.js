import { randomBytes } from "node:crypto";

const bytes = randomBytes(16);
console.log(bytes.toString("hex"));
