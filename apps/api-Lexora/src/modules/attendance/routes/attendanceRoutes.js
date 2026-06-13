import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { AttendanceController } from '../controllers/attendanceController.js';
import { validateAttendanceQuery, validateHoliday, validateId, validateLeaveRequest, validateLeaveReview } from '../validators/attendanceValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateAttendanceQuery, AttendanceController.list);
router.post('/rebuild', validateAttendanceQuery, AttendanceController.rebuild);
router.get('/leave-requests', AttendanceController.listLeaves);
router.post('/leave-requests', validateLeaveRequest, AttendanceController.createLeave);
router.post('/leave-requests/:id/review', validateId, validateLeaveReview, AttendanceController.reviewLeave);
router.get('/holidays', AttendanceController.listHolidays);
router.post('/holidays', validateHoliday, AttendanceController.createHoliday);

export default router;
