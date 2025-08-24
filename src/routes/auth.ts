import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Rotas de autenticação
router.post('/signup', asyncHandler(authController.signUp));
router.post('/signin', asyncHandler(authController.signIn));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/signout', asyncHandler(authController.signOut));
router.post('/signout-all', asyncHandler(authController.signOutAll));

// Rotas protegidas
router.get('/me', asyncHandler(authController.getCurrentUser));
router.get('/validate', asyncHandler(authController.validateToken));

export default router; 