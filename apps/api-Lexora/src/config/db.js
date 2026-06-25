import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    logger.info('database.connected', { database: connection.connection.name });
  } catch (err) {
    logger.error('database.connection_failed', { error: err });
    process.exit(1);
  }
};

export default connectDB;
