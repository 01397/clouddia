/// <reference types="vite/client" />

interface ImportMetaEnv {
  // VITE_APP_VERSIONは、GitHub Actionsによるビルド時にGit tagから取得したバージョン番号を設定する
  // 例: "v0.1.0"
  VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
