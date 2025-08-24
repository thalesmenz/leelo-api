import { Router, Request, Response, NextFunction } from 'express';
import { AnamneseAnswerController } from '../controllers/AnamneseAnswerController';

const router = Router();
const anamneseAnswerController = new AnamneseAnswerController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn.call(anamneseAnswerController, req, res, next)).catch(next);
  };
}

// CRUD básico
router.post('/', asyncHandler(anamneseAnswerController.createAnamneseAnswer));
router.get('/', asyncHandler(anamneseAnswerController.getAnamneseAnswers));
router.get('/:id', asyncHandler(anamneseAnswerController.getAnamneseAnswerById));
router.put('/:id', asyncHandler(anamneseAnswerController.updateAnamneseAnswer));
router.delete('/:id', asyncHandler(anamneseAnswerController.deleteAnamneseAnswer));

// Buscar por relacionamentos
router.get('/patient/:patient_id', asyncHandler(anamneseAnswerController.getAnamneseAnswersByPatientId));
router.get('/question/:question_id', asyncHandler(anamneseAnswerController.getAnamneseAnswersByQuestionId));
router.get('/appointment/:appointment_id', asyncHandler(anamneseAnswerController.getAnamneseAnswersByAppointmentId));

// Buscar com questões (join)
router.get('/patient/:patient_id/with-questions', asyncHandler(anamneseAnswerController.getAnamneseAnswersWithQuestions));

// Buscar anamnese completa com respostas
router.get('/patient/:patient_id/complete', asyncHandler(anamneseAnswerController.getAnamneseWithAnswers));

// Buscar por paciente e agendamento
router.get('/patient/:patient_id/appointment/:appointment_id', asyncHandler(anamneseAnswerController.getAnamneseAnswersByPatientAndAppointment));

// Buscar anamneses por usuário
router.get('/user/:user_id', asyncHandler(anamneseAnswerController.getAnamneseAnswersByUserId));

// Estatísticas
router.get('/statistics', asyncHandler(anamneseAnswerController.getStatistics));

// Operações em lote
router.post('/bulk', asyncHandler(anamneseAnswerController.bulkCreateAnamneseAnswers));

// Excluir por relacionamentos
router.delete('/patient/:patient_id', asyncHandler(anamneseAnswerController.deleteAnamneseAnswersByPatientId));
router.delete('/appointment/:appointment_id', asyncHandler(anamneseAnswerController.deleteAnamneseAnswersByAppointmentId));

export default router;

