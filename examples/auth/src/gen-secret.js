import { randomBytes } from "crypto";

const bytes = randomBytes(16);
console.log(bytes.toString("hex"));
