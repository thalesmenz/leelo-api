import { Router, Request, Response, NextFunction } from 'express';
import { AnamneseAnswerController } from '../controllers/AnamneseAnswerController';
import { authenticateToken } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const router = Router();
const anamneseAnswerController = new AnamneseAnswerController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn.call(anamneseAnswerController, req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de respostas de anamnese
// CRUD básico
router.post('/', authenticateToken, requireSubscription, asyncHandler(anamneseAnswerController.createAnamneseAnswer));
router.get('/', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswers));
router.get('/:id', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswerById));
router.put('/:id', authenticateToken, requireSubscription, asyncHandler(anamneseAnswerController.updateAnamneseAnswer));
router.delete('/:id', authenticateToken, requireSubscription, asyncHandler(anamneseAnswerController.deleteAnamneseAnswer));

// Buscar por relacionamentos
router.get('/patient/:patient_id', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswersByPatientId));
router.get('/question/:question_id', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswersByQuestionId));
router.get('/appointment/:appointment_id', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswersByAppointmentId));

// Buscar com questões (join)
router.get('/patient/:patient_id/with-questions', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswersWithQuestions));

// Buscar anamnese completa com respostas
router.get('/patient/:patient_id/complete', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseWithAnswers));

// Buscar por paciente e agendamento
router.get('/patient/:patient_id/appointment/:appointment_id', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswersByPatientAndAppointment));

// Buscar anamneses por usuário
router.get('/user/:user_id', authenticateToken, asyncHandler(anamneseAnswerController.getAnamneseAnswersByUserId));

// Estatísticas
router.get('/statistics', authenticateToken, asyncHandler(anamneseAnswerController.getStatistics));

// Operações em lote
router.post('/bulk', authenticateToken, requireSubscription, asyncHandler(anamneseAnswerController.bulkCreateAnamneseAnswers));

// Excluir por relacionamentos
router.delete('/patient/:patient_id', authenticateToken, requireSubscription, asyncHandler(anamneseAnswerController.deleteAnamneseAnswersByPatientId));
router.delete('/appointment/:appointment_id', authenticateToken, requireSubscription, asyncHandler(anamneseAnswerController.deleteAnamneseAnswersByAppointmentId));

export default router;

