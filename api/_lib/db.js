// Shared MongoDB connection. Serverless functions are re-used between
// invocations, so the client is cached on the module scope and on globalThis
// to survive hot reloads in local development.
const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'academic_lead';

// The only collection names the API will touch.
const COLLECTIONS = ['attendance', 'assessment', 'cocurricular', 'feedback', 'roster'];

let cached = globalThis.__academicLeadMongo;
if (!cached) {
  cached = globalThis.__academicLeadMongo = { client: null, promise: null };
}

async function getDb() {
  if (!URI) {
    const err = new Error('MONGODB_URI is not set. Add it in Vercel → Settings → Environment Variables.');
    err.status = 500;
    err.code = 'no_uri';
    throw err;
  }
  if (cached.client) return cached.client.db(DB_NAME);
  if (!cached.promise) {
    cached.promise = new MongoClient(URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000
    }).connect();
  }
  try {
    cached.client = await cached.promise;
  } catch (e) {
    cached.promise = null;
    const err = new Error('Could not reach the database. Check MONGODB_URI and that your Atlas network access allows 0.0.0.0/0.');
    err.status = 503;
    err.code = 'db_unreachable';
    throw err;
  }
  return cached.client.db(DB_NAME);
}

// Called once per cold start; cheap and idempotent.
let indexesReady = false;
async function ensureIndexes(db) {
  if (indexesReady) return;
  indexesReady = true;
  try {
    await Promise.all([
      db.collection('attendance').createIndex({ cls: 1, sem: 1, date: -1 }),
      db.collection('assessment').createIndex({ kind: 1, acadYear: 1, cls: 1 }),
      db.collection('cocurricular').createIndex({ acadYear: 1, date: -1 }),
      db.collection('feedback').createIndex({ cls: 1, sem: 1, subject: 1 }),
      db.collection('roster').createIndex({ cls: 1, rollNo: 1 }, { unique: true })
    ]);
  } catch (e) {
    // An index that already exists with different options is not fatal.
  }
}

function isValidCollection(name) {
  return COLLECTIONS.indexOf(name) >= 0;
}

module.exports = { getDb, ensureIndexes, isValidCollection, COLLECTIONS, DB_NAME };
