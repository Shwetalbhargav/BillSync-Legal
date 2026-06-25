import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import {
  acceptInvitation,
  expireInvitation,
  getWorkspaceContext,
  inviteMember,
  listMemberships,
  removeMembership,
  resendInvitation,
  revokeInvitation,
  updateMembership,
} from '../controllers/membershipController.js';
import {
  getOnboarding,
  updateOnboarding,
  updateWorkReview,
} from '../controllers/onboardingController.js';

const router = Router();

router.post('/invitations/accept', acceptInvitation);

router.use(authenticate);
router.get('/context', getWorkspaceContext);
router.get('/onboarding', getOnboarding);
router.patch('/onboarding', updateOnboarding);
router.patch('/work-review', updateWorkReview);
router.get('/memberships', listMemberships);
router.post('/invitations', inviteMember);
router.post('/invitations/:id/resend', resendInvitation);
router.post('/invitations/:id/expire', expireInvitation);
router.post('/invitations/:id/revoke', revokeInvitation);
router.patch('/memberships/:id', updateMembership);
router.delete('/memberships/:id', removeMembership);

export default router;
