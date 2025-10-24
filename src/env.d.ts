/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string; // 절대 ? 들어가면 안 됨
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
