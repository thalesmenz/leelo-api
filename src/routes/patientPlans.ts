import { Router, Request, Response, NextFunction } from 'express';
import { PatientPlanController } from '../controllers/PatientPlanController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const patientPlanController = new PatientPlanController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de planos de pacientes
// Create new patient plan
router.post('/', authenticateToken, asyncHandler(patientPlanController.createPatientPlan));

// Get all patient plans
router.get('/', authenticateToken, asyncHandler(patientPlanController.getPatientPlans));

// Get patient plan by ID
router.get('/:id', authenticateToken, asyncHandler(patientPlanController.getPatientPlanById));

// Update patient plan
router.put('/:id', authenticateToken, asyncHandler(patientPlanController.updatePatientPlan));

// Delete patient plan
router.delete('/:id', authenticateToken, asyncHandler(patientPlanController.deletePatientPlan));

// Search by name
router.get('/user/:user_id/search', authenticateToken, asyncHandler(patientPlanController.searchByName));

export default router; 