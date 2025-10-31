import { Router, Request, Response, NextFunction } from 'express';
import { PatientController } from '../controllers/PatientController';
import { PatientService } from '../services/PatientService';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const patientService = new PatientService();
const patientController = new PatientController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de pacientes
router.get('/', authenticateToken, asyncHandler(patientController.getPatients));
router.get('/id/:patient_id', authenticateToken, asyncHandler(patientController.getPatientById));
router.get('/:user_id/statistics', authenticateToken, asyncHandler(patientController.getPatientStatistics));
router.get('/:user_id/search', authenticateToken, asyncHandler(patientController.getPatientsByName));
router.get('/:user_id', authenticateToken, asyncHandler(patientController.getPatientByUserId));
router.post('/', authenticateToken, asyncHandler(patientController.createPatient));
router.put('/:user_id', authenticateToken, asyncHandler(patientController.updatePatientByUserId));
router.put('/id/:patient_id', authenticateToken, asyncHandler(patientController.updatePatientById));
router.delete('/:user_id', authenticateToken, asyncHandler(patientController.deletePatientByUserId));
router.delete('/id/:patient_id', authenticateToken, asyncHandler(patientController.deletePatientById));

export default router; 