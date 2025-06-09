/// <reference types="vite-plugin-solid-svg/types-component-solid" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Sets the initial proxy URL
  readonly VITE_PROXY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
