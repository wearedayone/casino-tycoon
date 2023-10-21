import admin from 'firebase-admin';

import environments from '../utils/environments.js';
import serviceAccountStaging from '../serviceAccounts/casino-tycoon.json' assert { type: 'json' };
import serviceAccountProduction from '../serviceAccounts/casino-tycoon-production.json' assert { type: 'json' };

const { ENVIRONMENT } = environments;
const serviceAccount =
  ENVIRONMENT === 'production'
    ? serviceAccountProduction
    : serviceAccountStaging;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;

export const firestore = admin.firestore();
