import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";
import { mdx } from "@cyco130/vite-plugin-mdx";

export default defineConfig({
	plugins: [mdx(), react(), rakkas()],
});
