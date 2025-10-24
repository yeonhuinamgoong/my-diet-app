/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string; // <-- 절대 ? 붙이지 말기
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
