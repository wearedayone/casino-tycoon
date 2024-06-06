import admin from 'firebase-admin';

import environments from '../utils/environments.js';
import serviceAccountDev from '../serviceAccounts/casino-tycoon.json' assert { type: 'json' };
import serviceAccountDemo from '../serviceAccounts/casino-tycoon-demo.json' assert { type: 'json' };
import serviceAccountStaging from '../serviceAccounts/casino-tycoon-staging.json' assert { type: 'json' };
import serviceAccountProduction from '../serviceAccounts/casino-tycoon-production.json' assert { type: 'json' };

const { ENVIRONMENT } = environments;
const serviceAccount =
  ENVIRONMENT === 'production'
    ? serviceAccountProduction
    : ENVIRONMENT === 'staging'
    ? serviceAccountStaging
    : ENVIRONMENT === 'demo'
    ? serviceAccountDemo
    : serviceAccountDev;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;

export const firestore = admin.firestore();
