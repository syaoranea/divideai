import { db } from '../firebaseAdmin';

export interface User {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  createdAt: Date;
}

export const userService = {
  async getUserByEmail(email: string): Promise<User | null> {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as User;
  },

  async getUserById(id: string): Promise<User | null> {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as User;
  },

  async createUser(data: { nome: string; email: string; senhaHash: string }): Promise<User> {
    const newUser = {
      ...data,
      createdAt: new Date(),
    };
    const docRef = await db.collection('users').add(newUser);
    return {
      id: docRef.id,
      ...newUser,
    };
  },
};
