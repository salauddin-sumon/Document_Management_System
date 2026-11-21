import Document from '../models/Document.js';
import Dealer from '../models/Dealer.js';
import AppError from '../utils/AppError.js';
import { storeUpload, removeFile, sendStoredFile } from '../utils/files.js';

// GET /api/dealers/:dealerId/documents
export const getDocuments = async (req, res) => {
  const docs = await Document.find({ dealer: req.params.dealerId })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email staffId');
  res.json(docs);
};

// POST /api/dealers/:dealerId/documents  (admin) — multipart: file, title, docType, expiryDate
export const uploadDocument = async (req, res) => {
  if (!req.file) throw new AppError('Please choose a file to upload', 400);

  const dealer = await Dealer.exists({ _id: req.params.dealerId });
  if (!dealer) throw new AppError('Dealer not found', 404);

  const stored = await storeUpload(req.file);
  try {
    const { title, docType, expiryDate } = req.body;
    const doc = await Document.create({
      dealer: req.params.dealerId,
      title: title || req.file.originalname,
      docType,
      expiryDate: expiryDate || undefined,
      ...stored,
      uploadedBy: req.user._id,
    });
    await doc.populate('uploadedBy', 'name email staffId');
    res.status(201).json(doc);
  } catch (err) {
    await removeFile(stored.fileName); // don't leave orphan files
    throw err;
  }
};

// GET /api/documents/:id/download
export const downloadDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new AppError('Document not found', 404);
  await sendStoredFile(res, doc);
};

// DELETE /api/documents/:id  (admin)
export const deleteDocument = async (req, res) => {
  const doc = await Document.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Document not found', 404);
  await removeFile(doc.fileName);
  res.json({ message: 'Document deleted' });
};
