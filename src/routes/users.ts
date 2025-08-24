import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get('/:user_id', asyncHandler(userController.getUserById));

export default router; 