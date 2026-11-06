import { Router } from 'express';
import { UserController } from './user.controller';

const router = Router();

// Utilisez UserController.register au lieu de registerUser
router.post('/register', UserController.register);

export default router;