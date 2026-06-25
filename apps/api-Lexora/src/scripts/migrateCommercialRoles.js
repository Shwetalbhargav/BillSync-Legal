import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import connectDB from '../config/db.js';
import { LEGACY_ROLE_MAP } from '../modules/workspace/roles.js';

async function main() {
  await connectDB();
  const users = mongoose.connection.db.collection('users');
  const memberships = mongoose.connection.db.collection('memberships');

  const results = {};
  for (const [legacyRole, commercialRole] of Object.entries(LEGACY_ROLE_MAP)) {
    const result = await users.updateMany(
      { role: legacyRole, commercialRole: { $exists: false } },
      { $set: { commercialRole } }
    );
    results[legacyRole] = result.modifiedCount;
  }

  const rows = await users.find({
    workspaceId: { $exists: true },
    commercialRole: { $exists: true },
  }).toArray();

  let membershipsCreated = 0;
  for (const user of rows) {
    const existing = await memberships.findOne({ workspaceId: user.workspaceId, userId: user._id });
    if (existing) continue;
    await memberships.insertOne({
      workspaceId: user.workspaceId,
      userId: user._id,
      role: user.commercialRole,
      status: 'active',
      acceptedAt: user.createdAt || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [],
    });
    membershipsCreated += 1;
  }

  console.log(JSON.stringify({ ok: true, roleUpdates: results, membershipsCreated }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});

