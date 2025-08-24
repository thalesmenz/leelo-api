import { Router, Request, Response, NextFunction } from 'express';
import { PatientPlanController } from '../controllers/PatientPlanController';

const router = Router();
const patientPlanController = new PatientPlanController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create new patient plan
router.post('/', asyncHandler(patientPlanController.createPatientPlan));

// Get all patient plans
router.get('/', asyncHandler(patientPlanController.getPatientPlans));

// Get patient plan by ID
router.get('/:id', asyncHandler(patientPlanController.getPatientPlanById));

// Update patient plan
router.put('/:id', asyncHandler(patientPlanController.updatePatientPlan));

// Delete patient plan
router.delete('/:id', asyncHandler(patientPlanController.deletePatientPlan));

// Search by name
router.get('/user/:user_id/search', asyncHandler(patientPlanController.searchByName));

export default router; 