/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string; // 반드시 있어야 한다고 강제
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
