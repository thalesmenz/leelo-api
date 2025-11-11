import { Router, Request, Response, NextFunction } from 'express';
import { PatientPlanController } from '../controllers/PatientPlanController';
import { authenticateToken } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const router = Router();
const patientPlanController = new PatientPlanController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de planos de pacientes
// Create new patient plan
router.post('/', authenticateToken, requireSubscription, asyncHandler(patientPlanController.createPatientPlan));

// Get all patient plans
router.get('/', authenticateToken, asyncHandler(patientPlanController.getPatientPlans));

// Get patient plan by ID
router.get('/:id', authenticateToken, asyncHandler(patientPlanController.getPatientPlanById));

// Update patient plan
router.put('/:id', authenticateToken, requireSubscription, asyncHandler(patientPlanController.updatePatientPlan));

// Delete patient plan
router.delete('/:id', authenticateToken, requireSubscription, asyncHandler(patientPlanController.deletePatientPlan));

// Search by name
router.get('/user/:user_id/search', authenticateToken, asyncHandler(patientPlanController.searchByName));

export default router; 