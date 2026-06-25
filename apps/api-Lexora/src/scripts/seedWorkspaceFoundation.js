import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import {
  ensureWorkspaceFoundationIndexes,
  seedCorePlatformData,
  validateWorkspaceFoundation,
} from '../modules/workspace/services/workspaceFoundationService.js';

async function main() {
  await connectDB();
  const db = mongoose.connection.db;

  await ensureWorkspaceFoundationIndexes(db);
  const seeded = await seedCorePlatformData(db);
  const validation = await validateWorkspaceFoundation(db);

  console.log(JSON.stringify({ ok: validation.ok, seeded, validation }, null, 2));
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
