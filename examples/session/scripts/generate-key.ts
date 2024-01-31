import installCryptoPolyfill from "@hattip/polyfills/crypto";
import { EncryptedCookieStore } from "@hattip/session";

// This is automatically handled by Hattip adapters in the main app
// but we need to do it manually here to make the script work.
installCryptoPolyfill();

const key = await EncryptedCookieStore.generateKey();
const base64 = await EncryptedCookieStore.exportKey(key);

console.log(base64);
