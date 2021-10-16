# TODO

## create-rakkas-app
- [ ] Add prepack script and files to generated package files
- [ ] Rename check scripts to test and remove npm-run-all dependency when possible
- [ ] Use detype to generate the vanilla JavaScript files
- [ ] Remove .npm-ignore, add .gitignore

## For 1.0.0
- [ ] Serverless platforms
  - [ ] Vercel
  - [ ] AWS Lambda (Begin / Architect)
  - [ ] Cloudflare Workers
  - [ ] Netlify
- [ ] Localizable and customizable router
- [ ] Rendering modes
  - [ ] Static (rendered when building)
  - [ ] Server (rendered on the server)
  - [ ] Incremental (rendered on the server and cached, served from the cache afterwards)
  - [ ] Client (rendered on the client)
- [ ] Investigate debugging and sourcemaps in SSR
- [ ] Add support for multipart/form-data
- [ ] Make server limits (maximum request body size etc.) configurable
- [ ] Allow custom error serializers
- [ ] Add a way to add cache-related HTTP headers on pages
- [ ] Add support for logging
- [ ] Spread dynamic route parameters
- [ ] Handle HEAD requests
- [ ] CLI command for creating pages, layouts, endpoints etc.
- [ ] RPC plugin
- [ ] Link prefetching
- [ ] HTTPS in dev server
- [ ] A way to trigger reloads from the load function
- [ ] Serialize the routes into a smaller string in an external file
- [ ] Data caching
	- [ ] Optimistic updates
	- [ ] Stale while revalidate strategy
- [ ] Contribution guidelines
- [ ] Document rakkasjs types
- [ ] Design a setData API
  - [ ] Design a navigate with data API
- [ ] Investigate [vite-jest](https://github.com/sodatea/vite-jest)
- [ ] Add support for React 18 features (streaming SSR, Suspense, startTransition, server components etc.)
- [ ] Service workers
- [ ] Support @vitejs/plugin-legacy
- [ ] Plugin system
- [ ] Investigate Vite warnings:
  - [ ] fs.allow warning: https://vitejs.dev/config/#server-fs-allow
  - [ ] Circular dependency warning
