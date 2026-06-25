import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { validateWorkspaceFoundation } from '../modules/workspace/services/workspaceFoundationService.js';

async function main() {
  await connectDB();
  const validation = await validateWorkspaceFoundation(mongoose.connection.db);
  console.log(JSON.stringify(validation, null, 2));
  if (!validation.ok) process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
