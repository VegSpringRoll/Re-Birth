import mongoose from 'mongoose';

let cachedConnection = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rp_engine';
  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Connected to MongoDB database successfully`);
    return cachedConnection;
  } catch (error) {
    console.error(`[Database] MongoDB connection error:`, error.message);
    cachedConnection = null;
  }
}
