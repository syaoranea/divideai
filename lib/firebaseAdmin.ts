import * as admin from 'firebase-admin';

const firebaseConfig = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
};

if (!admin.apps.length) {
  // Solo inicializar si tenemos las credenciais mínimas para evitar erros no build do Vercel
  if (firebaseConfig.project_id && firebaseConfig.client_email && firebaseConfig.private_key) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as any),
    });
  } else {
    console.warn("Firebase Admin SDK não foi inicializado: Credenciais ausentes nas variáveis de ambiente.");
  }
}

export const db = admin.apps.length ? admin.firestore() : {} as any;
export const auth = admin.apps.length ? admin.auth() : {} as any;
