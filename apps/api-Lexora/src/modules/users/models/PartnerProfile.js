// src/models/PartnerProfile.js

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';
import { GST_REGISTRATION_STATUSES, GSTIN_REGEX, PAN_REGEX } from '../utils/professionalRegistration.js';

const PartnerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  photoUrl: { type: String, default: '/images/default-user.jpg' },
  title: String,                      // e.g. Managing Partner
  specialization: { type: [String], default: [] },             // Arbitration, Corporate Law
  experienceYears: Number,
  landmarkCases: [
    { caseTitle: String, year: Number, description: String }
  ],
  achievements: [
    { title: String, year: Number, description: String }
  ],
  publications: [
    { title: String, link: String, year: Number }
  ],
  billingRate: { type: Number, default: 4000 },  // INR
  stateBarCouncil: { type: String, trim: true },
  enrolmentNo: { type: String, trim: true },
  enrolmentDate: { type: Date },
  pan: { type: String, trim: true, uppercase: true, match: PAN_REGEX },
  gstin: { type: String, trim: true, uppercase: true, match: GSTIN_REGEX },
  gstRegistrationStatus: { type: String, enum: GST_REGISTRATION_STATUSES, default: 'not_applicable' },
  professionalAddress: { type: String, trim: true },
  signatureImageUrl: { type: String, trim: true },
  registrationAuditTrail: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
});

PartnerProfileSchema.plugin(workspaceScopedPlugin);
const PartnerProfile = mongoose.model('PartnerProfile', PartnerProfileSchema);
export default PartnerProfile;
