# TODO

## For 0.4.0
- [ ] Static site generation
  1. Build the frontend but:
     1. Strip the load functions
     2. Use different client code:
        1. Load data from prerendered data files instead of calling load functions
        2. Make `reload` and `useReload` noops
  2. Start a backend development server in feigned production mode
  3. Visit the roots (defaulting to `["/"]`)
  4. Save the rendered data to a data file
  5. Save HTML files with script tags to load the prerendered data
  6. Add all newly encountered internal URLs to the roots
- [ ] Design a way to wrap the rendered application in custom providers
- [ ] Define page/layout types depending on the parent layout type
- [ ] Design an API to inject helpers to load functions
- [ ] Allow custom error serializers
- [ ] Add command to unpublish all canary releases
- [ ] Investigate Vite warnings:
  - [ ] fs.allow warning: https://vitejs.dev/config/#server-fs-allow
  - [ ] Circular dependency warning
- [ ] Project initializer enhancements:
  - [ ] Add option to skip generating the sample application
  - [ ] Add Cypress integration
  - [ ] Integrate `eslint-import-resolver-typescript`, `eslint-plugin-ssr-friendly`, and `eslint-plugin-css-modules`
- [ ] ⚠️ BUG: Reload loses focus
- [ ] ⚠️ BUG: Vite plugin ordering when using mdx
- [ ] Design a setData API
- [ ] Handle HEAD requests
- [ ] Serialize the routes into a smaller string in an external file
- [ ] Consider using [vite-react-jsx](https://github.com/alloc/vite-react-jsx) for the automatic JSX runtime support
- [ ] Expose `request.ip`
- [ ] chore: Add `engines` to `package.json` files
- [ ] Split documentation into multiple pages
- [x] Test the layout context API

## For 1.0.0
- [ ] Investigate debugging and sourcemaps
- Features
  - [ ] Add support for React 18 features (streaming SSR, Suspense, startTransition, server components etc.)
  - [ ] Add support for multipart/form-data
 	- [ ] Make server limits (maximum request body size etc.) configurable
  - [ ] Add a way to add cache-related HTTP headers on pages
  - [ ] Service workers
  - [ ] Link prefetching
  - [ ] HTTPS in dev server
  - [ ] Spread dynamic route parameters
  - [ ] Localizable and customizable router
  - [ ] Serverless platforms
    - [ ] Vercel
    - [ ] AWS Lambda (Begin / Architect)
    - [ ] Cloudflare Workers
    - [ ] Netlify
  - [ ] A way to trigger reloads from the reload function itself
  - [ ] Data caching
  	- [ ] Optimistic updates
  	- [ ] Stale while revalidate strategy
	- [ ] RPC plugin
- Chores
  - [ ] Contribution guidelines
  - [ ] Create integration examples with popular tools
    - [ ] Redux
    - [ ] Apollo
    - [ ] Styled components
    - [ ] Tailwind CSS
