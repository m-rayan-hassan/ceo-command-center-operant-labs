import express from 'express';
import { addMeeting, getTodaysMeetings } from '../controllers/meetingController.js';
import { protect } from '../middlewares/auth.middleware.js'; // Assuming you have authentication

const router = express.Router();

router.post('/', protect, addMeeting);
router.get('/today', protect, getTodaysMeetings);

export default router;
