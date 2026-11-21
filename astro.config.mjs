import { defineConfig } from "astro/config";
import remarkAdmonitions from "./src/plugins/remarkAdmonitions.mjs";

export default defineConfig({
  site: "https://zhangyvjing.com",
  base: "/blog",
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
    remarkPlugins: [remarkAdmonitions],
  },
});
