import IssueLetter from '../models/IssueLetter.js';
import Dealer from '../models/Dealer.js';
import AppError from '../utils/AppError.js';
import { storeUpload, removeFile, sendStoredFile, escapeRegex } from '../utils/files.js';

const populateDealer = { path: 'dealer', select: 'dealerId ownerName status' };

// Find which dealer owns a dealer code, and that code's BU / sales group.
// The BU always comes from the dealer code, so it can't be entered wrongly.
const findByCode = async (code) => {
  const dealerCode = String(code).trim().toUpperCase();
  const dealer = await Dealer.findOne({ 'codes.dealerCode': dealerCode });
  if (!dealer) throw new AppError(`No dealer found with code "${code}"`, 400);
  const entry = dealer.codes.find((c) => c.dealerCode === dealerCode);
  return {
    dealer: dealer._id,
    dealerCode,
    dealerId: dealer.dealerId,
    ownerName: dealer.ownerName,
    bu: entry.bu,
    salesGroup: entry.salesGroup,
  };
};

const EDITABLE = ['issueDate', 'referenceNumber', 'issuerName', 'issuerStaffId', 'designation', 'note'];
const pick = (body) => Object.fromEntries(EDITABLE.filter((f) => f in body).map((f) => [f, body[f]]));

// GET /api/issue-letters?search=&bu=&from=&to=&dealer=&page=&limit=
export const getLetters = async (req, res) => {
  const { search, bu, from, to, dealer } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

  const filter = {};
  if (dealer) filter.dealer = dealer;
  if (bu) filter.bu = bu;
  // Issue date range; both ends inclusive (dates are stored as midnight UTC)
  if (from || to) {
    filter.issueDate = {};
    if (from) filter.issueDate.$gte = new Date(from);
    if (to) filter.issueDate.$lte = new Date(to);
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      'referenceNumber',
      'dealerCode',
      'dealerId',
      'ownerName',
      'bu',
      'salesGroup',
      'issuerName',
      'issuerStaffId',
      'note',
    ].map((f) => ({ [f]: rx }));
  }

  const [letters, total, totalAll] = await Promise.all([
    IssueLetter.find(filter)
      .sort({ issueDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(populateDealer),
    IssueLetter.countDocuments(filter),
    IssueLetter.countDocuments(dealer ? { dealer } : {}),
  ]);

  res.json({ letters, total, totalAll, page, pages: Math.ceil(total / limit) || 1 });
};

// GET /api/issue-letters/filters — values for the BU dropdown
export const getLetterFilters = async (req, res) => {
  const [letterBus, dealerBus] = await Promise.all([
    IssueLetter.distinct('bu'),
    Dealer.distinct('codes.bu'),
  ]);
  const bus = [...new Set([...letterBus, ...dealerBus])].filter(Boolean).sort();
  res.json({ bus });
};

// GET /api/issue-letters/:id
export const getLetter = async (req, res) => {
  const letter = await IssueLetter.findById(req.params.id)
    .populate(populateDealer)
    .populate('createdBy', 'name email staffId');
  if (!letter) throw new AppError('Issue letter not found', 404);
  res.json(letter);
};

// POST /api/issue-letters  (admin, ZM/HOS) — multipart with optional "attachment"
export const createLetter = async (req, res) => {
  const dealerInfo = await findByCode(req.body.dealerCode); // checked before the file is stored
  const attachment = req.file ? await storeUpload(req.file) : undefined;
  try {
    const letter = await IssueLetter.create({
      ...pick(req.body),
      ...dealerInfo,
      attachment,
      createdBy: req.user._id,
    });
    await letter.populate(populateDealer);
    res.status(201).json(letter);
  } catch (err) {
    await removeFile(attachment?.fileName); // don't leave orphan files
    throw err;
  }
};

// PUT /api/issue-letters/:id  (admin) — a new attachment replaces the old one;
// send removeAttachment=true to delete it without replacing.
export const updateLetter = async (req, res) => {
  const letter = await IssueLetter.findById(req.params.id);
  if (!letter) throw new AppError('Issue letter not found', 404);

  const b = req.body;
  if (b.dealerCode && b.dealerCode.trim().toUpperCase() !== letter.dealerCode) {
    letter.set(await findByCode(b.dealerCode));
  }
  letter.set(pick(b));

  const oldFile = letter.attachment?.fileName;
  const newFile = req.file ? await storeUpload(req.file) : undefined;
  if (newFile) letter.attachment = newFile;
  else if (b.removeAttachment === 'true') letter.attachment = undefined;

  try {
    await letter.save();
  } catch (err) {
    await removeFile(newFile?.fileName);
    throw err;
  }
  if (oldFile && oldFile !== letter.attachment?.fileName) await removeFile(oldFile);

  await letter.populate(populateDealer);
  res.json(letter);
};

// DELETE /api/issue-letters/:id  (admin)
export const deleteLetter = async (req, res) => {
  const letter = await IssueLetter.findByIdAndDelete(req.params.id);
  if (!letter) throw new AppError('Issue letter not found', 404);
  await removeFile(letter.attachment?.fileName);
  res.json({ message: 'Issue letter deleted' });
};

// GET /api/issue-letters/:id/attachment  (?inline=1 to open in the browser)
export const downloadAttachment = async (req, res) => {
  const letter = await IssueLetter.findById(req.params.id);
  if (!letter?.attachment?.fileName) throw new AppError('Attachment not found', 404);
  await sendStoredFile(res, letter.attachment, { inline: Boolean(req.query.inline) });
};
