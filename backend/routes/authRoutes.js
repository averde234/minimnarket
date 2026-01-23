import express from 'express';
import { signUp, signIn, forgotPassword, updatePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/update-password', updatePassword);

export default router;