import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	plugins: [tsconfigPaths(), react(), rakkas()],
});
