import admin from 'firebase-admin';

import environments from '../utils/environments.js';
import serviceAccountStaging from '../serviceAccounts/sa-staging.json' assert { type: 'json' };
import serviceAccountProduction from '../serviceAccounts/sa-production.json' assert { type: 'json' };

const { ENVIRONMENT } = environments;
const serviceAccount = ENVIRONMENT === 'prd' ? serviceAccountProduction : serviceAccountStaging;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;

export const auth = admin.auth();

export const firestore = admin.firestore();
