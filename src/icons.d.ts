// Why it's needed: The ~icons/ imports don't actually exist as real
//   files. They're virtual modules created by the unplugin-icons Vite
//   plugin at build time. When you import ~icons/bi/gear, the plugin:
//   1. Intercepts the import
//   2. Fetches the SVG for the gear icon from the Bootstrap Icons set
//   3. Converts it to a SolidJS component
//   4. Returns that component

//   Without this declaration, TypeScript would error because it can't
//   find a file at ~icons/bi/gear. This declaration tells TypeScript
//   "trust me, imports matching this pattern will return a SolidJS
//   component" so it stops complaining and provides proper type checking.
declare module "~icons/*" {
  import type { Component } from "solid-js";
  const component: Component<{ class?: string }>;
  export default component;
}
