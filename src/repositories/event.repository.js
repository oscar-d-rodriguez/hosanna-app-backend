const { db } = require('../config/firebase');
const logger = require('../config/logger');

const COLLECTION = 'events';

const eventRepository = {
  async create(data) {
    const docRef = await db.collection(COLLECTION).add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info({ eventId: docRef.id }, 'Event created in Firestore');
    return { id: docRef.id, ...data };
  },

  async getById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async list({ limit = 20, startAfter } = {}) {
    let query = db
      .collection(COLLECTION)
      .orderBy('date', 'asc')
      .limit(limit);

    if (startAfter) {
      const startDoc = await db.collection(COLLECTION).doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async update(id, data) {
    await db.collection(COLLECTION).doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return this.getById(id);
  },

  async delete(id) {
    await db.collection(COLLECTION).doc(id).delete();
    logger.info({ eventId: id }, 'Event deleted from Firestore');
  },
};

module.exports = eventRepository;
