import { Router, Request, Response, NextFunction } from 'express';
import { MedicalRecordController } from '../controllers/MedicalRecordController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const medicalRecordController = new MedicalRecordController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de prontuários
// Criar novo prontuário
router.post('/', authenticateToken, asyncHandler(medicalRecordController.createMedicalRecord));

// Buscar todos os prontuários
router.get('/', authenticateToken, asyncHandler(medicalRecordController.getMedicalRecords));

// Buscar prontuário por ID
router.get('/:id', authenticateToken, asyncHandler(medicalRecordController.getMedicalRecordById));

// Buscar prontuários por profissional
router.get('/professional/:professionalId', authenticateToken, asyncHandler(medicalRecordController.getMedicalRecordsByProfessional));

// Buscar prontuários por paciente
router.get('/patient/:patientId', authenticateToken, asyncHandler(medicalRecordController.getMedicalRecordsByPatient));

// Atualizar prontuário
router.put('/:id', authenticateToken, asyncHandler(medicalRecordController.updateMedicalRecord));

// Excluir prontuário
router.delete('/:id', authenticateToken, asyncHandler(medicalRecordController.deleteMedicalRecord));

// Buscar prontuários
router.get('/search', authenticateToken, asyncHandler(medicalRecordController.searchMedicalRecords));

// Buscar estatísticas dos prontuários
router.get('/statistics/:professionalId', authenticateToken, asyncHandler(medicalRecordController.getMedicalRecordStatistics));

export default router;
