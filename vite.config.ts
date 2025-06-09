import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
// import { visualizer } from "rollup-plugin-visualizer";
import Icons from "unplugin-icons/vite";
import sassDts from "vite-plugin-sass-dts";
import solidSvg from "vite-plugin-solid-svg";

export default defineConfig({
  base: "/solid-mud-client/",
  plugins: [
    solid(),
    Icons({
      compiler: "solid",
      autoInstall: true,
    }),
    solidSvg(),
    sassDts(),
    // visualizer({
    //   template: "treemap",
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    //   filename: "bundle-analysis.html",
    // }),
  ],
});
