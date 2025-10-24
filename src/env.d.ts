interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
  // 다른 환경변수 있으면 여기에 계속 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
