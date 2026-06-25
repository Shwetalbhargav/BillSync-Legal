	// src/models/RateCard.js
	
	import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

	const RateCardSchema = new mongoose.Schema(
	  {
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
		clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
		caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
		activityCode: { type: String },

		ratePerHour: { type: Number, required: true, min: 0.01 },
		effectiveFrom: { type: Date, required: true },
		effectiveTo: { type: Date },
	  },
	  { timestamps: true }
	);

	RateCardSchema.index({ caseId: 1, clientId: 1, userId: 1, activityCode: 1, effectiveFrom: -1 });
	RateCardSchema.index({ userId: 1, caseId: 1, activityCode: 1, effectiveFrom: -1 });

	RateCardSchema.plugin(workspaceScopedPlugin);
	export const RateCard = mongoose.model('RateCard', RateCardSchema);
	export default RateCard;
