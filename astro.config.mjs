import { defineConfig } from "astro/config";
import remarkAdmonitions from "./src/plugins/remarkAdmonitions.mjs";

export default defineConfig({
  site: "https://vist233.github.io",
  base: "/blog",
  markdown: {
    remarkPlugins: [remarkAdmonitions],
  },
});
