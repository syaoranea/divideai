require('dotenv').config();
const admin = require('firebase-admin');

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
console.log("Raw key length:", rawKey?.length);
if (rawKey) {
    console.log("Raw char codes (first 50):", rawKey.substring(0, 50).split('').map(c => c.charCodeAt(0)).join(', '));
}

const formattedKey = rawKey?.replace(/\\n/g, '\n');
console.log("Formatted key length:", formattedKey?.length);
if (formattedKey) {
    console.log("Formatted char codes (first 50):", formattedKey.substring(0, 50).split('').map(c => c.charCodeAt(0)).join(', '));
}

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey?.trim(),
        })
    });
    console.log("Firebase Admin initialized successfully!");
} catch (error) {
    console.error("Error initializing Firebase Admin:", error);
}
