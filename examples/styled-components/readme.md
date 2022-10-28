# Rakkas `styled-components` Example

[StackBlitz](https://stackblitz.com/github/rakkasjs/rakkasjs/tree/main/examples/styled-components) | [CodeSandbox](https://codesandbox.io/s/github/rakkasjs/rakkasjs/tree/main/examples/styled-components)

[`styled-components`](https://styled-components.com/) doesn't support streaming SSR so this example [disables it](src/routes/layout.tsx). It uses the [`wrapApp` and `emitToDocumentHead` hooks](src/entry-hattip.tsx) to collect and inject server-rendered styles into the document head.
