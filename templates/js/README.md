# Rakkas JavaScript Starter

## Quick start

```sh
# Start development server on localhost:3000
npm run dev

# Start a development server on port 4000 and make it externally accessible
npm run dev -- --host=0.0.0.0 --port=4000

# Build a production server
npm run build

# Start production server on 0.0.0.0:3000
# and trust x-forwarded-* headers set by your reverse proxy
HOST=0.0.0.0 PORT=3000 TRUST_FORWARDED_ORIGIN=1 npm start
```

## Important files and directories

| Path               | Description                                   |
| ------------------ | --------------------------------------------- |
| `rakkas.config.js` | Rakkas configuration                          |
| `public`           | Static files to be served from `/`            |
| `src/client.js`    | Client-side cusomization hooks                |
| `src/server.js`    | Server-side customization hooks               |
| `src/pages`        | Pages and layouts (client-side routes)        |
| `src/api`          | Endpoints and middleware (server-side routes) |

## All development scripts

Some of them might not be available depending on the features you selected when generating his project.

| Script                     | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Start development server on localhost:3000               |
| `npm run build`            | Build a production server                                |
| `npm start`                | Start the production server                              |
| `npm run check`            | Run all checks (linters, tests)                          |
| `npm test`                 | Run all tests                                            |
| `npm run test:unit`        | Run unit tests                                           |
| `npm run test:e2e`         | Start the server and run end-to-end tests (build first!) |
| `npm run test:e2e:api`     | Run end-to-end API tests (start the server first!)       |
| `npm run test:e2e:browser` | Run end-to-end browser tests (start the server first!)   |
| `npm run lint`             | Run all linters                                          |
| `npm run lint:ts`          | Lint TypeScript files                                    |
| `npm run lint:css`         | Lint CSS files                                           |
| `npm run format`           | Format source files with Prettier                        |
