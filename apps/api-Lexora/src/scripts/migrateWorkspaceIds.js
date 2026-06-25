import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import connectDB from '../config/db.js';

const COLLECTIONS_WITH_FIRM_ID = [
  'users',
  'admins',
  'clients',
  'caseassignments',
];

const DIRECT_WORKSPACE_COLLECTIONS = [
  'activities',
  'activitysamples',
  'appusageevents',
  'attendancedays',
  'billables',
  'cases',
  'emailentries',
  'holidays',
  'idleintervals',
  'integrationlogs',
  'invoices',
  'invoicelines',
  'kpisnapshots',
  'leaverequests',
  'matterdocuments',
  'payments',
  'ratecards',
  'storeddocuments',
  'tasks',
  'timeentries',
  'worksessions',
  'zohoconnections',
  'partnerprofiles',
  'lawyerprofiles',
  'associateprofiles',
  'internprofiles',
];

async function updateFromParent(collectionName, localField, parentCollectionName) {
  const db = mongoose.connection.db;
  const collection = db.collection(collectionName);
  const rows = await collection.find({
    workspaceId: { $exists: false },
    [localField]: { $exists: true, $ne: null },
  }).toArray();
  let updated = 0;

  for (const row of rows) {
    const parent = await db.collection(parentCollectionName).findOne(
      { _id: row[localField], workspaceId: { $exists: true } },
      { projection: { workspaceId: 1 } },
    );
    if (!parent?.workspaceId) continue;
    await collection.updateOne({ _id: row._id }, { $set: { workspaceId: parent.workspaceId } });
    updated += 1;
  }

  return updated;
}

async function quarantineReport(collectionNames) {
  const db = mongoose.connection.db;
  const report = {};
  for (const name of collectionNames) {
    const count = await db.collection(name).countDocuments({ workspaceId: { $exists: false } });
    if (count) report[name] = count;
  }
  return report;
}

async function main() {
  await connectDB();
  const db = mongoose.connection.db;

  const results = {};
  for (const name of COLLECTIONS_WITH_FIRM_ID) {
    const result = await db.collection(name).updateMany(
      { workspaceId: { $exists: false }, firmId: { $exists: true, $ne: null } },
      [{ $set: { workspaceId: '$firmId' } }],
    );
    results[name] = { direct: result.modifiedCount };
  }

  results.cases = {
    ...(results.cases || {}),
    fromClient: await updateFromParent('cases', 'clientId', 'clients'),
  };
  results.caseassignments = {
    ...(results.caseassignments || {}),
    fromCase: await updateFromParent('caseassignments', 'caseId', 'cases'),
  };
  results.invoices = { fromClient: await updateFromParent('invoices', 'clientId', 'clients') };
  results.invoicelines = { fromInvoice: await updateFromParent('invoicelines', 'invoiceId', 'invoices') };
  results.payments = { fromInvoice: await updateFromParent('payments', 'invoiceId', 'invoices') };

  for (const [name, localField, parent] of [
    ['activities', 'caseId', 'cases'],
    ['activitysamples', 'workSessionId', 'worksessions'],
    ['appusageevents', 'workSessionId', 'worksessions'],
    ['billables', 'caseId', 'cases'],
    ['emailentries', 'caseId', 'cases'],
    ['idleintervals', 'workSessionId', 'worksessions'],
    ['matterdocuments', 'caseId', 'cases'],
    ['ratecards', 'caseId', 'cases'],
    ['storeddocuments', 'caseId', 'cases'],
    ['tasks', 'caseId', 'cases'],
    ['timeentries', 'caseId', 'cases'],
    ['worksessions', 'caseId', 'cases'],
  ]) {
    results[name] = {
      ...(results[name] || {}),
      [`from_${parent}`]: await updateFromParent(name, localField, parent),
    };
  }

  const quarantine = await quarantineReport([
    ...COLLECTIONS_WITH_FIRM_ID,
    ...DIRECT_WORKSPACE_COLLECTIONS,
  ]);

  console.log(JSON.stringify({ ok: Object.keys(quarantine).length === 0, results, quarantine }, null, 2));
  await mongoose.disconnect();
  if (Object.keys(quarantine).length) process.exitCode = 2;
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
