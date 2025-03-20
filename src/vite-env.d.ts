/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 'production' では GitHub Actionsのビルド時に渡される

  /**
   * Git tagから取得したバージョン文字列
   * @example 'v1.0.0'
   */
  VITE_APP_VERSION: string;

  /**
   * Google Analytics 4 の Measurement ID
   * @example 'G-XXXXXXXXXX'
   */
  VITE_GA4_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
