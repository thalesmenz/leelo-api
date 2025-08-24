import { Router, Request, Response, NextFunction } from 'express';
import { PatientController } from '../controllers/PatientController';
import { PatientService } from '../services/PatientService';

const router = Router();
const patientService = new PatientService();
const patientController = new PatientController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get('/', asyncHandler(patientController.getPatients));
router.get('/id/:patient_id', asyncHandler(patientController.getPatientById));
router.get('/:user_id/statistics', asyncHandler(patientController.getPatientStatistics));
router.get('/:user_id/search', asyncHandler(patientController.getPatientsByName));
router.get('/:user_id', asyncHandler(patientController.getPatientByUserId));
router.post('/', asyncHandler(patientController.createPatient));
router.put('/:user_id', asyncHandler(patientController.updatePatientByUserId));
router.delete('/:user_id', asyncHandler(patientController.deletePatientByUserId));
router.delete('/id/:patient_id', asyncHandler(patientController.deletePatientById));

export default router; 