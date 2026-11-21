import Dealer from '../models/Dealer.js';
import IssueLetter from '../models/IssueLetter.js';

// GET /api/dashboard/stats
export const getStats = async (req, res) => {
  const year = new Date().getFullYear();

  const [statusCounts, codeCount, lettersThisYear, recentLetters, recentDealers] = await Promise.all([
    Dealer.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Dealer.aggregate([{ $project: { n: { $size: '$codes' } } }, { $group: { _id: null, total: { $sum: '$n' } } }]),
    IssueLetter.countDocuments({ issueDate: { $gte: new Date(Date.UTC(year, 0, 1)) } }),
    IssueLetter.find()
      .sort({ issueDate: -1, createdAt: -1 })
      .limit(5)
      .select('referenceNumber issueDate dealerCode dealerId ownerName bu note'),
    Dealer.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('dealerId ownerName status codes.dealerCode codes.bu updatedAt'),
  ]);

  const byStatus = { active: 0, suspended: 0, closed: 0 };
  statusCounts.forEach((s) => (byStatus[s._id] = s.count));

  res.json({
    totalDealers: byStatus.active + byStatus.suspended + byStatus.closed,
    totalCodes: codeCount[0]?.total || 0,
    byStatus,
    year,
    lettersThisYear,
    recentLetters,
    recentDealers,
  });
};
