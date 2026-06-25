import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { validateEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Migration } from '../modules/operations/models/Migration.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '..', 'migrations');

async function migrationFiles() {
  const entries = await fs.readdir(migrationsDir);
  return entries.filter((entry) => entry.endsWith('.js')).sort();
}

async function checksum(filePath) {
  const contents = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(contents).digest('hex');
}

export async function runMigrations({ dryRun = false } = {}) {
  validateEnv();
  await connectDB();
  const files = await migrationFiles();
  const applied = await Migration.find({}).select('name checksum').lean();
  const appliedByName = new Map(applied.map((row) => [row.name, row]));
  const pending = [];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const mod = await import(pathToFileURL(filePath));
    const migrationName = mod.name || file.replace(/\.js$/, '');
    const hash = await checksum(filePath);
    if (appliedByName.has(migrationName)) continue;
    pending.push({ file, filePath, migrationName, hash, up: mod.up });
  }

  if (dryRun) return { pending: pending.map((item) => item.migrationName) };

  for (const migration of pending) {
    logger.info('migration.start', { migration: migration.migrationName });
    await migration.up(mongoose.connection.db);
    await Migration.create({ name: migration.migrationName, checksum: migration.hash });
    logger.info('migration.applied', { migration: migration.migrationName });
  }

  return { applied: pending.map((item) => item.migrationName) };
}

export async function rollbackLastMigration() {
  validateEnv();
  await connectDB();
  const files = await migrationFiles();
  const fileByMigrationName = new Map();
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const mod = await import(pathToFileURL(filePath));
    fileByMigrationName.set(mod.name || file.replace(/\.js$/, ''), { file, filePath, mod });
  }

  const latest = await Migration.findOne({}).sort({ appliedAt: -1, createdAt: -1 }).lean();
  if (!latest) return { rolledBack: [] };

  const migration = fileByMigrationName.get(latest.name);
  if (!migration?.mod?.down) {
    const error = new Error(`Migration ${latest.name} does not define a rollback`);
    error.code = 'MIGRATION_ROLLBACK_UNAVAILABLE';
    throw error;
  }

  logger.info('migration.rollback_start', { migration: latest.name });
  await migration.mod.down(mongoose.connection.db);
  await Migration.deleteOne({ _id: latest._id });
  logger.info('migration.rolled_back', { migration: latest.name });
  return { rolledBack: [latest.name] };
}

const command = process.argv[2] || 'up';
const runner = command === 'down'
  ? rollbackLastMigration()
  : runMigrations({ dryRun: command === 'status' });

runner
  .then((result) => {
    logger.info('migration.complete', result);
    return mongoose.disconnect();
  })
  .catch(async (error) => {
    logger.error('migration.failed', { error });
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
