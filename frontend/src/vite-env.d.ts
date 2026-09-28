/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  SeaTalkLogin?: {
    init(options: {
      container: HTMLElement;
      app_id: string;
      redirect_uri?: string;
      response_type: string;
      state: string;
      onError?: (message?: string) => void;
    }): void;
  };
}
