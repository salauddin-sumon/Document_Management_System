import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true, index: true },
    title: { type: String, required: true, trim: true },
    docType: { type: String, enum: ['contract', 'invoice', 'license', 'other'], default: 'other' },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true }, // name on disk
    mimeType: String,
    size: Number,
    expiryDate: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
