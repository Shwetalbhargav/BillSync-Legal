import mongoose from 'mongoose';

const MigrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    checksum: { type: String, trim: true },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Migration = mongoose.model('Migration', MigrationSchema);
export default Migration;
