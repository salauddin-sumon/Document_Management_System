import Notice from '../models/Notice.js';
import Dealer from '../models/Dealer.js';
import AppError from '../utils/AppError.js';

// GET /api/dealers/:dealerId/notices
export const getNotices = async (req, res) => {
  const notices = await Notice.find({ dealer: req.params.dealerId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email staffId');
  res.json(notices);
};

// POST /api/dealers/:dealerId/notices  (admin)
export const createNotice = async (req, res) => {
  const dealer = await Dealer.exists({ _id: req.params.dealerId });
  if (!dealer) throw new AppError('Dealer not found', 404);

  const { title, message, priority } = req.body;
  const notice = await Notice.create({
    dealer: req.params.dealerId,
    title,
    message,
    priority,
    createdBy: req.user._id,
  });
  await notice.populate('createdBy', 'name email staffId');
  res.status(201).json(notice);
};

// PUT /api/notices/:id  (admin)
export const updateNotice = async (req, res) => {
  const { title, message, priority } = req.body;
  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    { title, message, priority },
    { returnDocument: 'after', runValidators: true }
  ).populate('createdBy', 'name email staffId');
  if (!notice) throw new AppError('Notice not found', 404);
  res.json(notice);
};

// DELETE /api/notices/:id  (admin)
export const deleteNotice = async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) throw new AppError('Notice not found', 404);
  res.json({ message: 'Notice deleted' });
};
