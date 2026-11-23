
import dns from 'node:dns';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '8.8.4.4']);

export async function connectDatabase() {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not configured. Set it in backend/.env before starting the backend.');
  }

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  await mongoose.connect(MONGO_URI, {
    dbName: 'expirEase_db',
    serverSelectionTimeoutMS: 10000,
  });

  console.info(`MongoDB connected to database "${mongoose.connection.name}".`);
  return mongoose.connection;
}
