import { db } from '../firebaseAdmin';

export interface Property {
  id: string;
  nome: string;
  descricao: string;
  precoTotalDiaria: number;
  capacidadeMaxima: number;
  quartos: number;
  localizacao: string;
  comodidades: string | string[]; // JSON string or parsed array
  imagemUrl: string;
  linkReserva: string;
  createdAt: Date;
}


export const propertyService = {
  async getAllProperties(): Promise<Property[]> {
    const snapshot = await db.collection('properties').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as Property;
    });
  },

  async getPropertyById(id: string): Promise<Property | null> {
    const doc = await db.collection('properties').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Property;
  },

  async createProperty(data: Omit<Property, 'id' | 'createdAt'>): Promise<Property> {
    const newProperty = {
      ...data,
      createdAt: new Date(),
    };
    const docRef = await db.collection('properties').add(newProperty);
    return {
      id: docRef.id,
      ...newProperty,
    };
  },

  async updateProperty(id: string, data: Partial<Property>): Promise<void> {
    await db.collection('properties').doc(id).update(data);
  },

  async deleteProperty(id: string): Promise<void> {
    await db.collection('properties').doc(id).delete();
  },
};
