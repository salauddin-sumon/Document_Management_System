import multer from 'multer';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
};

// Express 5 forwards errors thrown in async handlers here automatically
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 400;
    const LABELS = {
      dealerCode: 'Dealer code',
      'codes.dealerCode': 'Dealer code',
      referenceNumber: 'Reference number',
      email: 'Email',
      staffId: 'Staff ID',
    };
    const keys = Object.keys(err.keyValue || {});
    const field = keys[0];
    message = keys.includes('nidNumber') && keys.includes('tradeLicense')
      ? 'Another dealer already has this NID number and trade license'
      : `${LABELS[field] || field} "${err.keyValue?.[field]}" already exists`;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10 MB)' : err.message;
  }

  if (status === 500) console.error(err);
  res.status(status).json({ message });
};
