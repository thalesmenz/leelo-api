import { Router, Request, Response, NextFunction } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';

const router = Router();
const appointmentController = new AppointmentController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create appointment
router.post('/', asyncHandler(appointmentController.createAppointment));

// Create appointment without conflict check (for private dashboard)
router.post('/without-conflict-check', asyncHandler(appointmentController.createAppointmentWithoutConflictCheck));

// Get all appointments (with optional filters)
router.get('/', asyncHandler(appointmentController.getAppointments));

// Get appointment by ID
router.get('/:id', asyncHandler(appointmentController.getAppointmentById));

// Get appointments by user ID
router.get('/user/:user_id', asyncHandler(appointmentController.getAppointmentsByUserId));

// Get available slots for a user on a specific date
router.get('/user/:user_id/available-slots', asyncHandler(appointmentController.getAvailableSlots));

// Update appointment
router.put('/:id', asyncHandler(appointmentController.updateAppointment));

// Update appointment status
router.patch('/:id/status', asyncHandler(appointmentController.updateAppointmentStatus));

// Delete appointment
router.delete('/:id', asyncHandler(appointmentController.deleteAppointment));

export default router; 