/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_EXPRESS_BACKEND_URL: string;
  // add other env vars here as needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
