# @rakkasjs/css

`@rakkasjs/css` is a Rakkas plugin that implements a very small (~500 bytes gzipped) atomic CSS-in-JS solution for Rakkas that handles server-side rendering and streaming out of the box.

## Installation

```bash
npm install -D @rakkasjs/css
```

## Usage

Add the plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { rakkasCss } from "@rakkasjs/css/vite-plugin";
import rakkas from "@rakkasjs/vite-plugin";

export default defineConfig({
  plugins: [rakkas(), rakkasCss()],
});
```

Then use the `css` function to create CSS class names:

```tsx
import { css } from "@rakkasjs/css";

export function StyledHeading() {
  return (
    <h1
      className={css({
        backgroundColor: "lightblue",
        color: "red",
        // Pseudo-classes and pseudo-elements are supported
        "&:hover": {
          color: "blue",
        },
        // So are media queries and other at-rules
        "@media(max-width:600px)": {
          color: "green",
        },
      })}
    >
      Hello, world!
    </h1>
  );
}
```

The above example will generate four class names (one for each rule), e.g. `s1 s2 s3 s4`. The generated CSS will look like this:

```css
.s1 {
  background-color: lightblue;
}

.s2 {
  color: red;
}

.s3:hover {
  color: blue;
}

@media (max-width: 600px) {
  .s4 {
    color: green;
  }
}
```

When server-side rendering, the generated CSS will be inlined into a style tag in the HTML. Styles encountered inside suspense boundaries will be streamed to the client as they are resolved.
