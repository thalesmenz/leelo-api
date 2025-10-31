import { Router, Request, Response, NextFunction } from 'express';
import { UserServiceController } from '../controllers/UserServiceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const userServiceController = new UserServiceController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de serviços
// Create service
router.post('/', authenticateToken, asyncHandler(userServiceController.createService));

// Get services by user ID
router.get('/user/:user_id', authenticateToken, asyncHandler(userServiceController.getServicesByUserId));

// Get service by ID
router.get('/:id', authenticateToken, asyncHandler(userServiceController.getServiceById));

// Update service
router.put('/:id', authenticateToken, asyncHandler(userServiceController.updateService));

// Toggle service status
router.patch('/:id/toggle-status', authenticateToken, asyncHandler(userServiceController.toggleServiceStatus));

// Delete service
router.delete('/:id', authenticateToken, asyncHandler(userServiceController.deleteService));

export default router; 