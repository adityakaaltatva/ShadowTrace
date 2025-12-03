import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { app } from './config';
import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';

const initializeFirebase = () => {
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
};

export { 
    initializeFirebase, 
    FirebaseProvider,
    FirebaseClientProvider,
    useFirebase, 
    useFirebaseApp, 
    useAuth, 
    useFirestore
};
