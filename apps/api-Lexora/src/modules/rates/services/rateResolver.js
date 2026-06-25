import mongoose from 'mongoose';
import { Firm } from '../../firms/models/Firm.js';
import User from '../../users/models/User.js';
import AssociateProfile from '../../users/models/AssociateProfile.js';
import InternProfile from '../../users/models/InternProfile.js';
import LawyerProfile from '../../users/models/LawyerProfile.js';
import PartnerProfile from '../../users/models/PartnerProfile.js';
import { RateCard } from '../models/RateCard.js';

const withSession = (query, session) =>
  session && query && typeof query.session === 'function' ? query.session(session) : query;

const toObjectId = (value) => {
  if (!value) return null;
  const raw = String(value._id || value);
  return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
};

const cleanActivityCode = (value) => {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).trim();
  return cleaned ? cleaned : null;
};

const missingObjectIdClause = (field) => ({
  $or: [{ [field]: { $exists: false } }, { [field]: null }],
});

const missingStringClause = (field) => ({
  $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: '' }],
});

const activeWindowClauses = (at) => [
  { effectiveFrom: { $lte: at } },
  {
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: null },
      { effectiveTo: { $gte: at } },
    ],
  },
];

const profileModelForRole = (role) => {
  switch (String(role || '').toLowerCase()) {
    case 'partner':
      return PartnerProfile;
    case 'lawyer':
      return LawyerProfile;
    case 'associate':
      return AssociateProfile;
    case 'intern':
      return InternProfile;
    default:
      return null;
  }
};

const buildRateCardQuery = ({ userId, clientId, caseId, activityCode, at }) => {
  const query = {
    $and: activeWindowClauses(at),
  };

  if (userId) {
    query.userId = userId;
  } else {
    query.$and.push(missingObjectIdClause('userId'));
  }

  if (clientId) {
    query.clientId = clientId;
  } else {
    query.$and.push(missingObjectIdClause('clientId'));
  }

  if (caseId) {
    query.caseId = caseId;
  } else {
    query.$and.push(missingObjectIdClause('caseId'));
  }

  if (activityCode) {
    query.activityCode = activityCode;
  } else {
    query.$and.push(missingStringClause('activityCode'));
  }

  return query;
};

const asRateResult = ({ ratePerHour, source, sourceType }) => ({
  ratePerHour: ratePerHour == null ? null : Number(ratePerHour),
  source: source || null,
  sourceType: sourceType || null,
});

export const computeRatedAmount = ({ amount, ratePerHour, billableMinutes }) => {
  if (amount != null) return Number(amount);
  const rate = Number(ratePerHour || 0);
  const hours = Number(billableMinutes || 0) / 60;
  return Number((rate * hours).toFixed(2));
};

export async function resolveBillingRate({
  userId,
  clientId,
  caseId,
  activityCode,
  at,
  session,
} = {}) {
  const resolvedUserId = toObjectId(userId);
  if (!resolvedUserId) {
    return asRateResult({ ratePerHour: null, source: null, sourceType: null });
  }

  const resolvedCaseId = toObjectId(caseId);
  const resolvedClientId = toObjectId(clientId);
  const resolvedActivityCode = cleanActivityCode(activityCode);
  const ts = at ? new Date(at) : new Date();

  const attempts = [
    resolvedCaseId && resolvedActivityCode
      ? { userId: resolvedUserId, clientId: null, caseId: resolvedCaseId, activityCode: resolvedActivityCode }
      : null,
    resolvedCaseId ? { userId: resolvedUserId, clientId: null, caseId: resolvedCaseId, activityCode: null } : null,
    resolvedCaseId && resolvedActivityCode
      ? { userId: null, clientId: null, caseId: resolvedCaseId, activityCode: resolvedActivityCode }
      : null,
    resolvedCaseId ? { userId: null, clientId: null, caseId: resolvedCaseId, activityCode: null } : null,
    resolvedClientId && resolvedActivityCode
      ? { userId: null, clientId: resolvedClientId, caseId: null, activityCode: resolvedActivityCode }
      : null,
    resolvedClientId ? { userId: null, clientId: resolvedClientId, caseId: null, activityCode: null } : null,
    resolvedActivityCode ? { userId: resolvedUserId, clientId: null, caseId: null, activityCode: resolvedActivityCode } : null,
    { userId: resolvedUserId, clientId: null, caseId: null, activityCode: null },
  ].filter(Boolean);

  for (const attempt of attempts) {
    const query = buildRateCardQuery({
      userId: attempt.userId,
      clientId: attempt.clientId,
      caseId: attempt.caseId,
      activityCode: attempt.activityCode,
      at: ts,
    });
    const hit = await withSession(RateCard.findOne(query).sort({ effectiveFrom: -1 }), session);
    if (hit) {
      return asRateResult({
        ratePerHour: hit.ratePerHour,
        source: hit,
        sourceType: 'rateCard',
      });
    }
  }

  const user = await withSession(
    User.findById(resolvedUserId).select('role firmId'),
    session
  );
  if (!user) {
    return asRateResult({ ratePerHour: null, source: null, sourceType: null });
  }

  const ProfileModel = profileModelForRole(user.role);
  if (ProfileModel) {
    const profile = await withSession(ProfileModel.findOne({ userId: resolvedUserId }), session);
    if (profile?.billingRate != null) {
      return asRateResult({
        ratePerHour: profile.billingRate,
        source: profile,
        sourceType: 'profile',
      });
    }
  }

  if (user.firmId) {
    const firm = await withSession(
      Firm.findById(user.firmId).select('billingPreferences.defaultRate'),
      session
    );
    if (firm?.billingPreferences?.defaultRate != null) {
      return asRateResult({
        ratePerHour: firm.billingPreferences.defaultRate,
        source: firm,
        sourceType: 'firm',
      });
    }
  }

  return asRateResult({ ratePerHour: null, source: null, sourceType: null });
}

export const rateResolverInternals = {
  buildRateCardQuery,
  cleanActivityCode,
  missingObjectIdClause,
  missingStringClause,
  profileModelForRole,
  toObjectId,
};
