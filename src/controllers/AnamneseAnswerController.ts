import { Request, Response } from 'express';
import { AnamneseAnswerService } from '../services/AnamneseAnswerService';
import { CreateAnamneseAnswerDTO, UpdateAnamneseAnswerDTO, AnamneseAnswerFilters } from '../types/anamneseAnswer';

export class AnamneseAnswerController {
  private anamneseAnswerService: AnamneseAnswerService;

  constructor() {
    this.anamneseAnswerService = new AnamneseAnswerService();
  }

  async createAnamneseAnswer(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateAnamneseAnswerDTO = req.body;
      const answer = await this.anamneseAnswerService.createAnamneseAnswer(data);
      res.status(201).json(answer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseAnswers(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnamneseAnswerFilters = req.query as any;
      const answers = await this.anamneseAnswerService.getAnamneseAnswers(filters);
      res.status(200).json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseAnswerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const answer = await this.anamneseAnswerService.getAnamneseAnswerById(id);
      res.status(200).json(answer);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async getAnamneseAnswersByPatientId(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id } = req.params;
      const answers = await this.anamneseAnswerService.getAnamneseAnswersByPatientId(patient_id);
      res.status(200).json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseAnswersByQuestionId(req: Request, res: Response): Promise<void> {
    try {
      const { question_id } = req.params;
      const answers = await this.anamneseAnswerService.getAnamneseAnswersByQuestionId(question_id);
      res.status(200).json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseAnswersByAppointmentId(req: Request, res: Response): Promise<void> {
    try {
      const { appointment_id } = req.params;
      const answers = await this.anamneseAnswerService.getAnamneseAnswersByAppointmentId(appointment_id);
      res.status(200).json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseAnswersWithQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id } = req.params;
      const answers = await this.anamneseAnswerService.getAnamneseAnswersWithQuestions(patient_id);
      res.status(200).json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseAnswersByPatientAndAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, appointment_id } = req.params;
      const answers = await this.anamneseAnswerService.getAnamneseAnswersByPatientAndAppointment(patient_id, appointment_id);
      res.status(200).json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateAnamneseAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateAnamneseAnswerDTO = req.body;
      const answer = await this.anamneseAnswerService.updateAnamneseAnswer(id, data);
      res.status(200).json(answer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAnamneseAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.anamneseAnswerService.deleteAnamneseAnswer(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await this.anamneseAnswerService.getStatistics();
      res.status(200).json(statistics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseAnswersByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const answers = await this.anamneseAnswerService.getAnamneseAnswersByUserId(user_id);
      res.status(200).json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnamneseWithAnswers(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id } = req.params;
      const anamnese = await this.anamneseAnswerService.getAnamneseWithAnswers(patient_id);
      res.status(200).json(anamnese);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkCreateAnamneseAnswers(req: Request, res: Response): Promise<void> {
    try {
      const answers: CreateAnamneseAnswerDTO[] = req.body;
      const createdAnswers = await this.anamneseAnswerService.bulkCreateAnamneseAnswers(answers);
      res.status(201).json(createdAnswers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAnamneseAnswersByPatientId(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id } = req.params;
      await this.anamneseAnswerService.deleteAnamneseAnswersByPatientId(patient_id);
      res.status(200).json({ message: 'Todas as respostas da anamnese foram excluídas com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAnamneseAnswersByAppointmentId(req: Request, res: Response): Promise<void> {
    try {
      const { appointment_id } = req.params;
      await this.anamneseAnswerService.deleteAnamneseAnswersByAppointmentId(appointment_id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

