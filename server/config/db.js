import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    // Make database indexes match the schemas (e.g. unique dealer codes).
    // Fine for a small internal app; large apps manage indexes separately.
    await mongoose.syncIndexes();
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
