
// src/routes/auth.ts

import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { checkSuperAdmin } from '../middleware/adminMiddleware';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);


router.use(authenticateToken);

router.get('/profile', authController.getProfile);

router.post('/request-profile-update', authController.requestProfileUpdate);
router.post('/verify-and-update-profile', authController.verifyAndUpdateProfile);
router.delete('/delete-profile-image', authController.deleteProfileImage.bind(authController));

router.post(
  '/upload-image',
  upload.single('profileImage'),
  authController.uploadImage
);

router.delete('/delete-account', authController.deleteAccount);
router.post('/request-account-deletion', authController.requestAccountDeletion.bind(authController));
router.post('/confirm-account-deletion', authController.confirmAccountDeletion.bind(authController));
router.post('/logout', authController.logout);


router.post(
  '/admin/create-admin',
  checkSuperAdmin,
  authController.createAdminUser
);

export default router;