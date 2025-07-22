import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to the database');
  } catch (err) {
    console.error('Failed to connect to the database', err);
    throw err;
  }
}

export default connectDB;