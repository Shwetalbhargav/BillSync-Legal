import {
  canMutateFinancialRecords,
  canMutateLegalWork,
  canReadFinancialRecords,
} from '../modules/workspace/roles.js';

export function requireLegalMutation(req, res, next) {
  if (!canMutateLegalWork(req.user?.commercialRole || req.user?.role)) {
    return res.status(403).json({ ok: false, message: 'This role cannot change legal work' });
  }
  next();
}

export function requireFinancialRead(req, res, next) {
  if (!canReadFinancialRecords(req.user?.commercialRole || req.user?.role)) {
    return res.status(403).json({ ok: false, message: 'This role cannot access financial records' });
  }
  next();
}

export function requireFinancialMutation(req, res, next) {
  if (!canMutateFinancialRecords(req.user?.commercialRole || req.user?.role)) {
    return res.status(403).json({ ok: false, message: 'This role cannot change financial records' });
  }
  next();
}
