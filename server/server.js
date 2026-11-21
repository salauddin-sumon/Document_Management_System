import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { describeStorage } from './utils/storage.js';

const PORT = process.env.PORT || 5050;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET in server/.env (see .env.example)');
  process.exit(1);
}

await connectDB();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`File storage: ${describeStorage()}`);
});
