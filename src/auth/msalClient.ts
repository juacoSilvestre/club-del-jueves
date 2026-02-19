import { PublicClientApplication, type Configuration, type PopupRequest } from '@azure/msal-browser';

const clientId = process.env.REACT_APP_MSAL_CLIENT_ID;
const tenantId = process.env.REACT_APP_MSAL_TENANT_ID || 'common';
const redirectUri = typeof window !== 'undefined' ? window.location.origin : undefined;

const msalConfig: Configuration | null = clientId && redirectUri
  ? {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri
      },
      cache: {
        cacheLocation: 'localStorage'
      }
    }
  : null;

export const msalInstance = msalConfig ? new PublicClientApplication(msalConfig) : null;

export const msalLoginRequest: PopupRequest = {
  scopes: ['User.Read', 'email', 'openid', 'profile'],
  prompt: 'select_account'
};

export const hasMsalConfig = Boolean(msalInstance);