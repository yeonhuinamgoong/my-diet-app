/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string; // ✅ optional(?) 아님
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
