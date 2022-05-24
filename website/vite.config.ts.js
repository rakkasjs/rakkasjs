var __async = (__this, __arguments, generator) => {
	return new Promise((resolve, reject) => {
		var fulfilled = (value) => {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		};
		var rejected = (value) => {
			try {
				step(generator.throw(value));
			} catch (e) {
				reject(e);
			}
		};
		var step = (x) =>
			x.done
				? resolve(x.value)
				: Promise.resolve(x.value).then(fulfilled, rejected);
		step((generator = generator.apply(__this, __arguments)).next());
	});
};

// vite.config.ts
import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import mdx from "vite-plugin-mdx";
import fs from "fs";
import path from "path";
import { highlight, loadLanguages } from "reprism";
import tsx from "reprism/languages/typescript.js";
import bash from "reprism/languages/bash.js";
import rhypePrism from "@mapbox/rehype-prism";
loadLanguages(tsx, bash);
var vite_config_default = defineConfig({
	resolve: {
		alias: {
			$lib: "/src/lib",
			$examples: "/src/routes/examples",
		},
	},
	plugins: [
		rakkas({
			pageExtensions: ["jsx", "tsx", "mdx"],
		}),
		mdx({ rehypePlugins: [rhypePrism] }),
		{
			name: "code-sample-loader",
			enforce: "pre",
			resolveId(id, importer) {
				return __async(this, null, function* () {
					if (id.endsWith("?sample")) {
						const resolved = yield this.resolve(id.slice(0, -7), importer, {
							skipSelf: true,
						});
						if (resolved) return resolved.id + "?sample";
					}
				});
			},
			load(id) {
				return __async(this, null, function* () {
					if (id.endsWith("?sample")) {
						const filename = id.slice(0, -7);
						const content = fs.readFileSync(filename, "utf8");
						return {
							code: `export default {file: ${JSON.stringify(
								path.relative("src/pages/examples", filename),
							)}, code: ${JSON.stringify(highlight(content, "typescript"))}}`,
						};
					}
				});
			},
		},
	],
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmFra2FzIGZyb20gXCJyYWtrYXNqcy92aXRlLXBsdWdpblwiO1xuaW1wb3J0IG1keCBmcm9tIFwidml0ZS1wbHVnaW4tbWR4XCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG4vLyBAdHMtZXhwZWN0LWVycm9yOiBObyB0eXBpbmdzXG5pbXBvcnQgeyBoaWdobGlnaHQsIGxvYWRMYW5ndWFnZXMgfSBmcm9tIFwicmVwcmlzbVwiO1xuLy8gQHRzLWV4cGVjdC1lcnJvcjogTm8gdHlwaW5nc1xuaW1wb3J0IHRzeCBmcm9tIFwicmVwcmlzbS9sYW5ndWFnZXMvdHlwZXNjcmlwdC5qc1wiO1xuLy8gQHRzLWV4cGVjdC1lcnJvcjogTm8gdHlwaW5nc1xuaW1wb3J0IGJhc2ggZnJvbSBcInJlcHJpc20vbGFuZ3VhZ2VzL2Jhc2guanNcIjtcbi8vIEB0cy1leHBlY3QtZXJyb3I6IE5vIHR5cGluZ3NcbmltcG9ydCByaHlwZVByaXNtIGZyb20gXCJAbWFwYm94L3JlaHlwZS1wcmlzbVwiO1xuXG5sb2FkTGFuZ3VhZ2VzKHRzeCwgYmFzaCk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdHJlc29sdmU6IHtcblx0XHRhbGlhczoge1xuXHRcdFx0JGxpYjogXCIvc3JjL2xpYlwiLFxuXHRcdFx0JGV4YW1wbGVzOiBcIi9zcmMvcm91dGVzL2V4YW1wbGVzXCIsXG5cdFx0fSxcblx0fSxcblxuXHRwbHVnaW5zOiBbXG5cdFx0cmFra2FzKHtcblx0XHRcdHBhZ2VFeHRlbnNpb25zOiBbXCJqc3hcIiwgXCJ0c3hcIiwgXCJtZHhcIl0sXG5cdFx0fSksXG5cblx0XHRtZHgoeyByZWh5cGVQbHVnaW5zOiBbcmh5cGVQcmlzbV0gfSksXG5cblx0XHR7XG5cdFx0XHRuYW1lOiBcImNvZGUtc2FtcGxlLWxvYWRlclwiLFxuXG5cdFx0XHRlbmZvcmNlOiBcInByZVwiLFxuXG5cdFx0XHRhc3luYyByZXNvbHZlSWQoaWQsIGltcG9ydGVyKSB7XG5cdFx0XHRcdGlmIChpZC5lbmRzV2l0aChcIj9zYW1wbGVcIikpIHtcblx0XHRcdFx0XHRjb25zdCByZXNvbHZlZCA9IGF3YWl0IHRoaXMucmVzb2x2ZShpZC5zbGljZSgwLCAtNyksIGltcG9ydGVyLCB7XG5cdFx0XHRcdFx0XHRza2lwU2VsZjogdHJ1ZSxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRpZiAocmVzb2x2ZWQpIHJldHVybiByZXNvbHZlZC5pZCArIFwiP3NhbXBsZVwiO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRhc3luYyBsb2FkKGlkKSB7XG5cdFx0XHRcdGlmIChpZC5lbmRzV2l0aChcIj9zYW1wbGVcIikpIHtcblx0XHRcdFx0XHRjb25zdCBmaWxlbmFtZSA9IGlkLnNsaWNlKDAsIC03KTtcblx0XHRcdFx0XHRjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGVuYW1lLCBcInV0ZjhcIik7XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0Y29kZTogYGV4cG9ydCBkZWZhdWx0IHtmaWxlOiAke0pTT04uc3RyaW5naWZ5KFxuXHRcdFx0XHRcdFx0XHRwYXRoLnJlbGF0aXZlKFwic3JjL3BhZ2VzL2V4YW1wbGVzXCIsIGZpbGVuYW1lKSxcblx0XHRcdFx0XHRcdCl9LCBjb2RlOiAke0pTT04uc3RyaW5naWZ5KGhpZ2hsaWdodChjb250ZW50LCBcInR5cGVzY3JpcHRcIikpfX1gLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0fSxcblx0XSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFHQTtBQUVBO0FBRUE7QUFFQTtBQUVBLGNBQWMsS0FBSyxJQUFJO0FBRXZCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLFNBQVM7QUFBQSxJQUNSLE9BQU87QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFdBQVc7QUFBQSxJQUNaO0FBQUEsRUFDRDtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1IsT0FBTztBQUFBLE1BQ04sZ0JBQWdCLENBQUMsT0FBTyxPQUFPLEtBQUs7QUFBQSxJQUNyQyxDQUFDO0FBQUEsSUFFRCxJQUFJLEVBQUUsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQUEsSUFFbkM7QUFBQSxNQUNDLE1BQU07QUFBQSxNQUVOLFNBQVM7QUFBQSxNQUVILFVBQVUsSUFBSSxVQUFVO0FBQUE7QUFDN0IsY0FBSSxHQUFHLFNBQVMsU0FBUyxHQUFHO0FBQzNCLGtCQUFNLFdBQVcsTUFBTSxLQUFLLFFBQVEsR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUFHLFVBQVU7QUFBQSxjQUM5RCxVQUFVO0FBQUEsWUFDWCxDQUFDO0FBQ0QsZ0JBQUk7QUFBVSxxQkFBTyxTQUFTLEtBQUs7QUFBQSxVQUNwQztBQUFBLFFBQ0Q7QUFBQTtBQUFBLE1BRU0sS0FBSyxJQUFJO0FBQUE7QUFDZCxjQUFJLEdBQUcsU0FBUyxTQUFTLEdBQUc7QUFDM0Isa0JBQU0sV0FBVyxHQUFHLE1BQU0sR0FBRyxFQUFFO0FBQy9CLGtCQUFNLFVBQVUsR0FBRyxhQUFhLFVBQVUsTUFBTTtBQUVoRCxtQkFBTztBQUFBLGNBQ04sTUFBTSx5QkFBeUIsS0FBSyxVQUNuQyxLQUFLLFNBQVMsc0JBQXNCLFFBQVEsQ0FDN0MsWUFBWSxLQUFLLFVBQVUsVUFBVSxTQUFTLFlBQVksQ0FBQztBQUFBLFlBQzVEO0FBQUEsVUFDRDtBQUFBLFFBQ0Q7QUFBQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQ0QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
