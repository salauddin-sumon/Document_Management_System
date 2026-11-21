import mongoose from 'mongoose';

const req = (label) => [true, `${label} is required`];

const attachmentSchema = new mongoose.Schema(
  {
    originalName: String,
    fileName: String, // name on disk in uploads/
    mimeType: String,
    size: Number,
  },
  { _id: false }
);

const issueLetterSchema = new mongoose.Schema(
  {
    issueDate: { type: Date, required: req('Issue date') },
    referenceNumber: { type: String, required: req('Reference number'), unique: true, trim: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true, index: true },
    dealerCode: { type: String, required: req('Dealer code'), uppercase: true, trim: true },
    // Copied from the dealer / dealer code when the letter is issued, so the
    // letter still reads correctly if the dealer is edited or deleted later.
    bu: { type: String, trim: true },
    salesGroup: { type: String, trim: true },
    dealerId: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    issuerName: { type: String, required: req('Issuer name'), trim: true },
    issuerStaffId: { type: String, required: req('Issuer staff ID'), trim: true },
    designation: { type: String, required: req('Designation'), trim: true },
    note: { type: String, required: req('Note') },
    attachment: attachmentSchema,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('IssueLetter', issueLetterSchema);
