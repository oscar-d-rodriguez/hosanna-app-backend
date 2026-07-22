const admin = require('firebase-admin');

// On Cloud Run, default credentials are automatically available.
// Locally, set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
