import mongoose from 'mongoose';

const HolidaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    region: { type: String, trim: true, maxlength: 80, default: 'firm' },
    paid: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Holiday = mongoose.model('Holiday', HolidaySchema);
export default Holiday;
