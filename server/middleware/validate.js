import { validationResult } from 'express-validator';

// Runs after express-validator rules; returns 400 with the first error.
// (Uploaded files are still only in memory at this point, so nothing needs cleaning up.)
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

export default validate;
