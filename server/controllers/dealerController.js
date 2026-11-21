import Dealer from '../models/Dealer.js';
import Notice from '../models/Notice.js';
import Document from '../models/Document.js';
import IssueLetter from '../models/IssueLetter.js';
import AppError from '../utils/AppError.js';
import { removeFile, escapeRegex } from '../utils/files.js';

const OWNER_FIELDS = ['ownerName', 'mobile', 'nidNumber', 'tradeLicense'];
const CODE_FIELDS = ['dealerCode', 'bu', 'salesGroup', 'zone', 'baseName', 'codeOpenDate'];
const pickFrom = (obj, fields) =>
  Object.fromEntries(fields.filter((f) => obj[f] !== undefined).map((f) => [f, obj[f]]));

// Same normalisation the model applies, so lookups match what's stored
const normalise = ({ nidNumber, tradeLicense }) => ({
  nidNumber: String(nidNumber || '').trim(),
  tradeLicense: String(tradeLicense || '').trim().toUpperCase(),
});

// GET /api/dealers?search=&zone=&bu=&status=&page=&limit=
export const getDealers = async (req, res) => {
  const { search, zone, bu, status } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

  const conditions = [];
  if (zone) conditions.push({ 'codes.zone': zone });
  if (bu) conditions.push({ 'codes.bu': bu });
  if (status) conditions.push({ status });
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    conditions.push({
      $or: [
        'dealerId',
        'codes.dealerCode',
        'codes.bu',
        'codes.salesGroup',
        'codes.baseName',
        'ownerName',
        'mobile',
        'nidNumber',
        'tradeLicense',
      ].map((f) => ({ [f]: rx })),
    });
  }
  const filter = conditions.length ? { $and: conditions } : {};

  const [dealers, total, totalAll] = await Promise.all([
    Dealer.find(filter).sort({ dealerId: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Dealer.countDocuments(filter),
    Dealer.countDocuments(),
  ]);

  res.json({
    dealers,
    total, // matching the filters
    totalAll, // all dealers
    page,
    pages: Math.ceil(total / limit) || 1,
  });
};

// GET /api/dealers/meta — dropdown/suggestion values
export const getMeta = async (req, res) => {
  const [zones, bus, salesGroups, baseNames] = await Promise.all(
    ['codes.zone', 'codes.bu', 'codes.salesGroup', 'codes.baseName'].map((f) => Dealer.distinct(f))
  );
  res.json({
    zones: zones.sort(),
    bus: bus.sort(),
    salesGroups: salesGroups.sort(),
    baseNames: baseNames.sort(),
  });
};

// GET /api/dealers/codes — every dealer code, for the dealer picker on issue letters
export const getCodeOptions = async (req, res) => {
  const dealers = await Dealer.find().select('dealerId ownerName status codes').lean();
  const options = dealers.flatMap((d) =>
    d.codes.map((c) => ({
      dealer: d._id,
      dealerId: d.dealerId,
      ownerName: d.ownerName,
      status: d.status,
      dealerCode: c.dealerCode,
      bu: c.bu,
      salesGroup: c.salesGroup,
    }))
  );
  options.sort((a, b) => a.dealerCode.localeCompare(b.dealerCode));
  res.json(options);
};

// Dealers whose NID number OR trade license matches, each marked with what matched
const findMatches = async ({ nidNumber, tradeLicense }) => {
  const or = [];
  if (nidNumber) or.push({ nidNumber });
  if (tradeLicense) or.push({ tradeLicense });
  if (!or.length) return [];
  const dealers = await Dealer.find({ $or: or })
    .select('dealerId ownerName mobile nidNumber tradeLicense status codes')
    .sort({ dealerId: 1 })
    .lean();
  return dealers.map((d) => {
    const nid = Boolean(nidNumber) && d.nidNumber === nidNumber;
    const tl = Boolean(tradeLicense) && d.tradeLicense === tradeLicense;
    return { ...d, matchedOn: { nidNumber: nid, tradeLicense: tl }, exact: nid && tl };
  });
};

// GET /api/dealers/lookup?nidNumber=&tradeLicense=
// Used by the Add dealer form: does this NID number or trade license already belong to a dealer?
export const lookupDealer = async (req, res) => {
  res.json({ matches: await findMatches(normalise(req.query)) });
};

// GET /api/dealers/:id
export const getDealer = async (req, res) => {
  const dealer = await Dealer.findById(req.params.id)
    .populate('createdBy', 'name email staffId')
    .lean();
  if (!dealer) throw new AppError('Dealer not found', 404);
  const letterCount = await IssueLetter.countDocuments({ dealer: dealer._id });
  res.json({ ...dealer, letterCount });
};

// POST /api/dealers  (admin) — one dealer code per submission.
// If the NID number OR trade license already belongs to a dealer, the user must choose:
//   addToDealer: <dealer _id>  → add this code under that dealer (same dealer ID)
//   createNew: true           → create a new dealer ID anyway
// Without a choice the server answers 409 with the matches, and the form asks the user.
export const createDealer = async (req, res) => {
  const owner = { ...pickFrom(req.body, OWNER_FIELDS), ...normalise(req.body) };
  const code = pickFrom(req.body, CODE_FIELDS);
  code.dealerCode = String(code.dealerCode).trim().toUpperCase();
  const { addToDealer, createNew } = req.body;

  const taken = await Dealer.findOne({ 'codes.dealerCode': code.dealerCode }).select('dealerId').lean();
  if (taken) throw new AppError(`Dealer code ${code.dealerCode} already exists (dealer ${taken.dealerId})`, 400);

  const matches = await findMatches(owner);

  if (addToDealer) {
    if (!matches.some((m) => String(m._id) === String(addToDealer))) {
      throw new AppError('That dealer does not share this NID number or trade license', 400);
    }
    const existing = await Dealer.findById(addToDealer);
    // Keep the dealer's own NID / trade license; update the contact details to the latest
    existing.ownerName = owner.ownerName;
    existing.mobile = owner.mobile;
    existing.codes.push(code);
    await existing.save();
    return res.status(200).json({ ...existing.toObject(), addedToExisting: true });
  }

  if (matches.length && !createNew) {
    return res.status(409).json({
      message: 'This NID number or trade license already belongs to a dealer. Choose what to do.',
      matches,
    });
  }
  if (matches.some((m) => m.exact)) {
    const m = matches.find((x) => x.exact);
    throw new AppError(
      `${m.dealerId} already has this exact NID number and trade license, so the code must be added under ${m.dealerId}`,
      400
    );
  }

  const dealer = await Dealer.create({ ...owner, codes: [code], createdBy: req.user._id });
  res.status(201).json({ ...dealer.toObject(), addedToExisting: false });
};

// PUT /api/dealers/:id  (admin) — edit owner details, status and the existing codes
export const updateDealer = async (req, res) => {
  const dealer = await Dealer.findById(req.params.id);
  if (!dealer) throw new AppError('Dealer not found', 404);

  dealer.set({ ...pickFrom(req.body, [...OWNER_FIELDS, 'status']), ...normalise(req.body) });
  if (Array.isArray(req.body.codes)) {
    dealer.codes = req.body.codes.map((c) => ({ ...pickFrom(c, [...CODE_FIELDS, '_id']) }));
  }
  await dealer.save(); // save() (not findByIdAndUpdate) so the duplicate-code check runs
  res.json(dealer);
};

// DELETE /api/dealers/:id  (admin)
// Removes the dealer's notices and other files. Issue letters are kept as records.
export const deleteDealer = async (req, res) => {
  const dealer = await Dealer.findById(req.params.id);
  if (!dealer) throw new AppError('Dealer not found', 404);

  const docs = await Document.find({ dealer: dealer._id });
  await Promise.all(docs.map((d) => removeFile(d.fileName)));
  await Promise.all([
    Document.deleteMany({ dealer: dealer._id }),
    Notice.deleteMany({ dealer: dealer._id }),
    dealer.deleteOne(),
  ]);

  res.json({ message: 'Dealer deleted' });
};
