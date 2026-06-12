declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
      keycloak?: { url?: string; realm?: string; clientId?: string };
    };
  }
}

const runtime = (typeof window !== 'undefined' ? window.__env : undefined) ?? {};

export const environment = {
  production: false,
  apiUrl: runtime.apiUrl ?? 'http://localhost:8081',
  keycloak: {
    url: runtime.keycloak?.url ?? 'http://localhost:8180',
    realm: runtime.keycloak?.realm ?? 'chatims-app',
    clientId: runtime.keycloak?.clientId ?? 'chatims-client',
  },
};
