import dotenv from 'dotenv';
dotenv.config();

import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';

// Credenciales de entorno
const TENANT_ID = process.env.VITE_TENANT_ID;
const CLIENT_ID = process.env.VITE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_CLIENT_SECRET;

// Solo crear credential si existen las tres variables
const outlookCredential =
  TENANT_ID && CLIENT_ID && CLIENT_SECRET
    ? new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET)
    : null;

// Inicializar Graph Client solo si hay credenciales
const graphClient = outlookCredential
  ? Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await outlookCredential.getToken(
            'https://graph.microsoft.com/.default'
          );
          return token.token;
        },
      },
    })
  : null;
 
export { graphClient };
