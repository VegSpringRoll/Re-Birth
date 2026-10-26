import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rp_engine';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Connected to Local High-Performance MongoDB (data/db)`);
  } catch (error) {
    console.error(`[Database] MongoDB connection error:`, error.message);
    console.log(`[Database] Ensure local MongoDB daemon is running on port 27017.`);
  }
}
