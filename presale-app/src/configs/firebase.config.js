import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import environments from '../utils/environments';

const firebaseConfigs = {
  apiKey: environments.FIREBASE_API_KEY,
  authDomain: environments.FIREBASE_AUTH_DOMAIN,
  projectId: environments.FIREBASE_PROJECT_ID,
  storageBucket: environments.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: environments.FIREBASE_MESSAGING_SENDER_ID,
  appId: environments.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfigs);

export default firebaseApp;

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
