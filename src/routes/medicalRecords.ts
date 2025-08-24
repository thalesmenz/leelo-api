import { Router, Request, Response, NextFunction } from 'express';
import { MedicalRecordController } from '../controllers/MedicalRecordController';

const router = Router();
const medicalRecordController = new MedicalRecordController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Criar novo prontuário
router.post('/', asyncHandler(medicalRecordController.createMedicalRecord));

// Buscar todos os prontuários
router.get('/', asyncHandler(medicalRecordController.getMedicalRecords));

// Buscar prontuário por ID
router.get('/:id', asyncHandler(medicalRecordController.getMedicalRecordById));

// Buscar prontuários por profissional
router.get('/professional/:professionalId', asyncHandler(medicalRecordController.getMedicalRecordsByProfessional));

// Buscar prontuários por paciente
router.get('/patient/:patientId', asyncHandler(medicalRecordController.getMedicalRecordsByPatient));

// Atualizar prontuário
router.put('/:id', asyncHandler(medicalRecordController.updateMedicalRecord));

// Excluir prontuário
router.delete('/:id', asyncHandler(medicalRecordController.deleteMedicalRecord));

// Buscar prontuários
router.get('/search', asyncHandler(medicalRecordController.searchMedicalRecords));

// Buscar estatísticas dos prontuários
router.get('/statistics/:professionalId', asyncHandler(medicalRecordController.getMedicalRecordStatistics));

export default router;
