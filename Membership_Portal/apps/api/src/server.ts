import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app';

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || '';

const start = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(MONGODB_URI);
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
