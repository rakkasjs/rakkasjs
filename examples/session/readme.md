# Rakkas Session Example

> **This example requires Node.js 16 or newer.**

This example shows how to handle sessions with Rakkas. It's a toy e-commerce store that allows you to sign up, sign in, add items to your cart, and remove them.

It uses [HatTip session middleware](https://github.com/hattipjs/hattip/tree/main/packages/middleware/session) with `EncryptedCookieStore` which doesn't require any database. It stores users and products in memory but it could be easily replaced with a real database.

The `EncryptedCookieStore` requires a secret key to encrypt the session data. You can generate a random key with `node scripts/generate-key` and put it in a `.env` file at the root of the project like this:

```sh
SECRET_SESSION_KEY=...
```
