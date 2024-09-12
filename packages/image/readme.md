# @rakkasjs/image

This package contains the Rakkas image optimization plugin and responsive image component. It supports `.avif`, `.webp`, `.jpeg`, and `.png` formats.

`@rakkasjs/image` comes with a builtin [Sharp](https://sharp.pixelplumbing.com/)-based image optimizer that works on Node, Bun, and Deno but you can also use the `transformUrl` prop to use other image CDNs.

Currently, the image optimizer doesn't cache its inputs or outputs. In production, you should use a CDN or a reverse proxy in front of your Rakkas app to cache optimized images. Even then, external images will be downloaded for each width/quality/format combination requested. So the **external image functionality should be considered experimental**.

## TLDR

First, you should install `@rakkasjs/image` as a production dependency.

```bash
npm install -S @rakkasjs/image
# or `npm install -D @rakkasjs/image` if you will only use an external image CDN
```

> If you will only be using an external image CDN (and not the builtin optimizer), you can install it as a development dependency. In that case, you should also disable the image optimization endpoint by passing `disableOptimizationEndpoint: true` to the plugin options.

Then, add the plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";
import { rakkasImage } from "@rakkasjs/image/vite-plugin";

export default defineConfig({
  plugins: [react(), rakkas(), rakkasImage()],
});
```

Then, add `"@rakkasjs/image/types"` to the `types` field of your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@rakkasjs/image/types"]
  }
}
```

And, finally, import your image using a namespace import (`import * as`) and pass it to the `image` prop of the `Image` component:

```tsx
import type { Page } from "rakkasjs";
import { Image } from "@rakkasjs/image";
import * as myImage from "./my-image.jpg";

const MyPage: Page = () => {
  return (
    <div>
      <Image image={myImage} alt="My Image" />
    </div>
  );
};

export default MyPage;
```

This will render a responsive `img` element with a `srcset` attribute optimized for various screen sizes.

## The `Image` component

`Image` (exported from `@rakkasjs/image`) is a responsive image component which accepts the following props:

### `image?: ImageImport`

You can pass a namespace import (created with `import * as`) of an image file to this prop. Normally, Vite only provides a `default` export that contains the URL of the image. But the `@rakkasjs/image/vite-plugin` plugin will also add `width`, `height`, and `blurData` (only in production) exports.

### `layout: "fullWidth" | "constrained" | "fixed" = "constrained"`

`"fullWidth"` makes the image take the full width of its container. `"constrained"` makes the image take the full width of its container but not more than its intrinsic width. `"fixed"` makes the image take its intrinsic width.

### `src?: string`

The unoptimized image URL. If you provide the `image` prop, this will be automatically set to the URL exported by the plugin but you can override.

### `width?: number` and `height?: number`

The intrinsic width and height of the image.

If you provide the `image` prop, these will be automatically set to the values exported by the plugin but you can override. If you only override one of them, the other will be calculated to maintain the aspect ratio.

If you don't provide the `image` prop, you're strongly advised to provide these props to avoid layout shifts. Images without a known `width` will not be optimized.

### `transformUrl?: (src: string, width: number, quality: number) => string`

A function that transforms the image URL to an optimized URL. The default implementation uses the builtin image optimizer but you can provide your own implementation to use an external image CDN. For example, for Unsplash, you can use the following implementation:

```tsx
function transformUnsplashUrl(src: string, width: number, quality?: number) {
  return (
    `${src}?w=${width}&fit=min&auto=format` + (quality ? `&q=${quality}` : "")
  );
}
```

### `quality?: number`

The quality of the optimized image.

### `breakpoints?: number[]`

Breakpoints used to generate the `srcset` attribute. The default is the following:

```ts
// Values stolen from unpic
const DEFAULT_BREAKPOINTS = [
  6016, // 6K
  5120, // 5K
  4480, // 4.5K
  3840, // 4K
  3200, // QHD+
  2560, // WQXGA
  2048, // QXGA
  1920, // 1080p
  1668, // Various iPads
  1280, // 720p
  1080, // iPhone 6-8 Plus
  960, // older horizontal phones
  828, // iPhone XR/11
  750, // iPhone 6-8
  640, // older and lower-end phones
];
```

### `background?: string`

A CSS background shorthand property to be used as a placeholder while the image is loading. If you provide the `image` prop, this will be calculated from the `blurData` export (only in production). Otherwise a small version of the image will be used as a placeholder. If you want to disable the placeholder, you can set this to `"none"`.

### `highPriority?: boolean`

If `true`, the `fetchPriority` attribute will default to `"high"`. When `fetchPriority` is set to `"high"`, the `loading` attribute will default to `"eager"` and the `decoding` attribute will default to `"eager"`.

### `unoptimized?: boolean`

If `true`, the image will not be optimized.

### `unstyled?: boolean`

The `Image` component normally adds some default styling according to the `layout` prop. If you set this to `true`, no styling will be added.

### Other props

The `Image` component accepts all other props that an `img` element accepts, the only difference being that the `alt` prop is required. The following props will be set automatically but can be overridden:

- `fetchPriority`
- `loading`
- `decoding`
- `sizes`
- `srcSet`
- `style`
- `role`

## Image optimization endpoint

The plugin installs an API endpoint at `/_app/image/[width]/[quality]/[image]` that handles optimization.

`width` must be an integer between 1 and 8192 or the original width of the image, whichever is smaller (`@rakkasjs/image` never upscales images).

`quality` must be an integer between 1 and 100 or `auto`. When set to `auto`, Sharp's default quality for the output format is used.

The `image` parameter must be encoded with `encodeURIComponent` and is either a path relative to the assets directory (`dist/client/_app/assets`) or an external URL. An external URL is only allowed if it matches one of the patterns specified in the plugin option `externalUrlPatterns`. In development, any filesystem path is allowed but in production only the files in the assets directory are allowed.

The output format for the optimized image is determined via content negotiation based on the `Accept` header of the request. If `allowAvif` option is `true`, the endpoint will prefer AVIF if supported. Otherwise it will prefer WebP, and if that's not supported, the image's original format (determined by the file extension, defaulting to JPEG).

The endpoint returns an optimized image with the `ETag`, `Content-Type`, `Cache-Control` (only in production), and `Vary` headers set appropriately.

The response will have an `ETag` and `Cache-Control` header in production which can be tweaked using the `cacheControl` and `externalCacheControl` plugin options.

## Plugin options

The plugin options control the behavior of the builtin image optimizer.

### `allowAvif: boolean = true`

Whether to allow AVIF format. The AVIF format usually provides better compression and quality but it might be slower to encode.

### `externalUrlPatterns: string[] = []`

> Note that currently the optimizer doesn't cache external images so they will be downloaded for each width/quality/format combination requested. For this reason, the external image functionality **should be considered experimental**.

An array of URL patterns that can be used for external images (via the `ExternalImage` component). If a URL does not match any of these patterns, it will be rejected with a 403 status code. By default, no external URLs are allowed.

URL patterns must consist of a protocol, a domain name, and an optional path and are interpreted as prefixes.

- The protocol must be `http`, `https`, or `*` (wildcard), followed by `://`.
- The domain name may start with `*.` to match a single subdomain or `**.` to match any subdomain. Other `*` characters are not allowed.
- The path, if present, should start with `/`. It should usually end with `/`. Wildcards are not allowed.

Examples:

- `http://example.com` matches `http://example.com`, `http://example.com/`, `http://example.com/test`, etc.
- `https://example.com` matches `https://example.com`, `https://example.com/`, `https://example.com/test`, etc.
- `*://example.com` matches `http://example.com`, `http://example.com/`, `http://example.com/test`, `https://example.com`, `https://example.com/`, `https://example.com/test`, etc.
- `http://*.example.com` matches `http://foo.example.com`, `http://bar.example.com`, but not `http://example.com` or `http://foo.bar.example.com`.
- `http://**.example.com` matches `http://foo.example.com`, `http://foo.bar.example.com`, but not `http://example.com`.
- `http://example.com/test-` matches `http://example.com/test-pic.jpg`, but not `http://example.com/test-dir/`.

### `cacheControl: string = "public, max-age=31536000, immutable"`

The `Cache-Control` header to be set for non-external optimized images. This header is only set in production. The default is very aggressive because imported assets already have a hash in their URL and, in principle, they can be cached forever.

### `externalCacheControl: string = cacheControl`

The `Cache-Control` header to be set for external optimized images. It defaults to the value of `cacheControl`. You should only leave this default if your external URLs already have a hash or other cache-busting mechanism in their URL.

### `disableOptimizationEndpoint: boolean = false`

If `true`, the image optimization endpoint will not be installed. This is useful if you want to use an external image CDN exclusively.
