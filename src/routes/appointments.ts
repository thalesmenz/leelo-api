import { Router, Request, Response, NextFunction } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { authenticateToken } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const router = Router();
const appointmentController = new AppointmentController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de consultas
// Create appointment
router.post('/', authenticateToken, requireSubscription, asyncHandler(appointmentController.createAppointment));

// Create appointment without conflict check (for private dashboard)
router.post('/without-conflict-check', authenticateToken, requireSubscription, asyncHandler(appointmentController.createAppointmentWithoutConflictCheck));

// Get all appointments (with optional filters)
router.get('/', authenticateToken, asyncHandler(appointmentController.getAppointments));

// Get appointment by ID
router.get('/:id', authenticateToken, asyncHandler(appointmentController.getAppointmentById));

// Get appointments by user ID
router.get('/user/:user_id', authenticateToken, asyncHandler(appointmentController.getAppointmentsByUserId));

// Get available slots for a user on a specific date
router.get('/user/:user_id/available-slots', authenticateToken, asyncHandler(appointmentController.getAvailableSlots));

// Update appointment
router.put('/:id', authenticateToken, requireSubscription, asyncHandler(appointmentController.updateAppointment));

// Update appointment status
router.patch('/:id/status', authenticateToken, requireSubscription, asyncHandler(appointmentController.updateAppointmentStatus));

// Delete appointment
router.delete('/:id', authenticateToken, requireSubscription, asyncHandler(appointmentController.deleteAppointment));

export default router; 