import mongoose from 'mongoose';
import { nextSequence } from './Counter.js';

const req = (label) => [true, `${label} is required`];

// A dealer (one person) can work with several of the company's BUs and gets a
// separate dealer code for each. Each code has its own BU, sales group, zone and base.
const dealerCodeSchema = new mongoose.Schema({
  dealerCode: { type: String, required: req('Dealer code'), uppercase: true, trim: true },
  bu: { type: String, required: req('BU'), trim: true },
  salesGroup: { type: String, required: req('Sales group'), trim: true },
  zone: { type: String, required: req('Zone'), trim: true },
  baseName: { type: String, required: req('Base name'), trim: true },
  codeOpenDate: { type: Date, required: req('Code open date') },
});

export const DEALER_STATUSES = ['active', 'suspended', 'closed'];

const dealerSchema = new mongoose.Schema(
  {
    // Human-readable unique ID, generated automatically: DLR-0001, DLR-0002…
    dealerId: { type: String, unique: true, uppercase: true, trim: true },
    ownerName: { type: String, required: req('Owner name'), trim: true },
    mobile: { type: String, required: req('Mobile number'), trim: true },
    // NID number + trade license identify the person: same pair = same dealer
    nidNumber: { type: String, required: req('NID number'), trim: true },
    tradeLicense: { type: String, required: req('Trade license'), uppercase: true, trim: true },
    status: { type: String, enum: DEALER_STATUSES, default: 'active' },
    codes: {
      type: [dealerCodeSchema],
      validate: [(v) => v.length > 0, 'At least one dealer code is required'],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// A dealer code must be unique across ALL dealers
dealerSchema.index({ 'codes.dealerCode': 1 }, { unique: true });
// Only one dealer per NID + trade license
dealerSchema.index({ nidNumber: 1, tradeLicense: 1 }, { unique: true });

dealerSchema.pre('validate', async function () {
  // Give new dealers the next ID
  if (this.isNew && !this.dealerId) {
    const n = await nextSequence('dealer');
    this.dealerId = `DLR-${String(n).padStart(4, '0')}`;
  }
  // The unique index doesn't catch the same code twice inside one dealer, so check here
  const seen = new Set();
  for (const c of this.codes) {
    if (seen.has(c.dealerCode)) this.invalidate('codes', `Dealer code ${c.dealerCode} is entered twice`);
    seen.add(c.dealerCode);
  }
});

export default mongoose.model('Dealer', dealerSchema);
