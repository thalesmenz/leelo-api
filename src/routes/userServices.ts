import { Router, Request, Response, NextFunction } from 'express';
import { UserServiceController } from '../controllers/UserServiceController';

const router = Router();
const userServiceController = new UserServiceController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create service
router.post('/', asyncHandler(userServiceController.createService));

// Get services by user ID
router.get('/user/:user_id', asyncHandler(userServiceController.getServicesByUserId));

// Get service by ID
router.get('/:id', asyncHandler(userServiceController.getServiceById));

// Update service
router.put('/:id', asyncHandler(userServiceController.updateService));

// Toggle service status
router.patch('/:id/toggle-status', asyncHandler(userServiceController.toggleServiceStatus));

// Delete service
router.delete('/:id', asyncHandler(userServiceController.deleteService));

export default router; 