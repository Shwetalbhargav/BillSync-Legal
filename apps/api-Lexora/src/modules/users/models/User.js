// src/models/User.js

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';
import { COMMERCIAL_ROLES } from '../../workspace/roles.js';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {type: String, required: false, trim: true  },
  role: { 
    type: String, 
    enum: [...COMMERCIAL_ROLES, 'partner', 'associate', 'intern', 'admin'], 
    required: true,
    default: 'lawyer'
  },
  commercialRole: { type: String, enum: COMMERCIAL_ROLES, default: 'lawyer', index: true },
  firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm' },
  tokenVersion: { type: Number, default: 0 },
  passwordResetTokenHash: { type: String },
  passwordResetExpiresAt: { type: Date },
  passwordResetUsedAt: { type: Date },
  passwordHash: { type: String, required: true },
  photoUrl: { type: String, default: '/images/default-user.jpg' },

  // Login identifier we use in the controller:
  mobile: { type: String, sparse: true, trim: true, required: true },

  // Optional universal profile-ish fields (ok to keep)
  address: { type: String },
  qualifications: [
    { degree: String, university: String, year: Number }
  ]
});
UserSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
UserSchema.index({ workspaceId: 1, mobile: 1, role: 1 }, { unique: true });
UserSchema.plugin(workspaceScopedPlugin);
const User = mongoose.model('User', UserSchema);
export default User;
