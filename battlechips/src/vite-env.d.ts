/// <reference types="vite/client" />

/** Build-time configuration. Both are optional — sensible defaults are compiled in. */
interface ImportMetaEnv {
  /** WalletConnect project id. Public by design; overridable per deployment. */
  readonly VITE_WC_PROJECT_ID?: string;
  /** Solana RPC for the funding window. The public endpoint is heavily rate-limited. */
  readonly VITE_SOLANA_RPC?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
