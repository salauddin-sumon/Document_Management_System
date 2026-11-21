import mongoose from 'mongoose';

// Simple sequence generator, e.g. for dealer IDs (DLR-0001, DLR-0002…)
const counterSchema = new mongoose.Schema({
  _id: String, // name of the sequence, e.g. "dealer"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// Atomically get the next number in a sequence
export const nextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return counter.seq;
};

export default Counter;
