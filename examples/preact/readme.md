# Rakkas Preact Example

This is a simple example of how to use Rakkas with [Preact](https://preactjs.com/) in React compatibility mode (`preact/compat`).

**There are some problems with client-side navigation at the moment:** In development mode, **it doesn't work at all**. In production, it works but you will see a flash of a blank page before the new page is rendered. The problem in the production is caused by Preact's lack of support for the concurrent mode. React can render a new component tree in the background while still showing the old one, but Preact can't. I don't know the root cause of the problem in development mode, but it's probably related.
