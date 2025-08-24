import { Request, Response } from 'express';
import { AnamneseQuestionService } from '../services/AnamneseQuestionService';
import { CreateAnamneseQuestionDTO, UpdateAnamneseQuestionDTO } from '../types/anamneseQuestion';

export class AnamneseQuestionController {
  private anamneseQuestionService: AnamneseQuestionService;

  constructor() {
    this.anamneseQuestionService = new AnamneseQuestionService();
  }

  createAnamneseQuestion = async (req: Request, res: Response) => {
    try {
      const questionData: CreateAnamneseQuestionDTO = req.body;
      
      // Validate required fields
      if (!questionData.user_id || !questionData.question || !questionData.type) {
        return res.status(400).json({
          success: false,
          message: 'user_id, question e type são campos obrigatórios.'
        });
      }

      // Validate type
      if (!['text', 'number', 'boolean', 'multiple_choice'].includes(questionData.type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo deve ser: text, number, boolean ou multiple_choice.'
        });
      }

      // Validate multiple choice options
      if (questionData.type === 'multiple_choice' && (!questionData.options || !Array.isArray(questionData.options))) {
        return res.status(400).json({
          success: false,
          message: 'Questões de múltipla escolha devem ter opções válidas.'
        });
      }

      const result = await this.anamneseQuestionService.createAnamneseQuestion(questionData);
      res.status(201).json({
        success: true,
        message: 'Questão de anamnese criada com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar questão de anamnese.'
      });
    }
  };

  getAnamneseQuestions = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const questions = await this.anamneseQuestionService.getAnamneseQuestions(filters);
      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar questões de anamnese.'
      });
    }
  };

  getAnamneseQuestionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const question = await this.anamneseQuestionService.getAnamneseQuestionById(id);
      
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Questão de anamnese não encontrada.'
        });
      }

      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar questão de anamnese.'
      });
    }
  };

  getAnamneseQuestionsByUserId = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const questions = await this.anamneseQuestionService.getAnamneseQuestionsByUserId(user_id);
      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar questões de anamnese do usuário.'
      });
    }
  };

  updateAnamneseQuestion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const questionData: UpdateAnamneseQuestionDTO = req.body;

      // Check if question exists
      const existingQuestion = await this.anamneseQuestionService.getAnamneseQuestionById(id);
      if (!existingQuestion) {
        return res.status(404).json({
          success: false,
          message: 'Questão de anamnese não encontrada.'
        });
      }

      // Validate type if provided
      if (questionData.type && !['text', 'number', 'boolean', 'multiple_choice'].includes(questionData.type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo deve ser: text, number, boolean ou multiple_choice.'
        });
      }

      // Validate multiple choice options if type is being changed
      if (questionData.type === 'multiple_choice' && (!questionData.options || !Array.isArray(questionData.options))) {
        return res.status(400).json({
          success: false,
          message: 'Questões de múltipla escolha devem ter opções válidas.'
        });
      }

      const updated = await this.anamneseQuestionService.updateAnamneseQuestion(id, questionData);
      res.status(200).json({
        success: true,
        message: 'Questão de anamnese atualizada com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar questão de anamnese.'
      });
    }
  };

  deleteAnamneseQuestion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if question exists
      const existingQuestion = await this.anamneseQuestionService.getAnamneseQuestionById(id);
      if (!existingQuestion) {
        return res.status(404).json({
          success: false,
          message: 'Questão de anamnese não encontrada.'
        });
      }

      await this.anamneseQuestionService.deleteAnamneseQuestion(id);
      res.status(200).json({
        success: true,
        message: 'Questão de anamnese removida com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover questão de anamnese.'
      });
    }
  };

  reorderQuestions = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { questionIds } = req.body;

      if (!questionIds || !Array.isArray(questionIds)) {
        return res.status(400).json({
          success: false,
          message: 'questionIds deve ser um array válido.'
        });
      }

      const reorderedQuestions = await this.anamneseQuestionService.reorderQuestions(user_id, questionIds);
      res.status(200).json({
        success: true,
        message: 'Ordem das questões atualizada com sucesso!',
        data: reorderedQuestions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao reordenar questões.'
      });
    }
  };

  getQuestionsByCategory = async (req: Request, res: Response) => {
    try {
      const { user_id, category } = req.params;
      const questions = await this.anamneseQuestionService.getQuestionsByCategory(user_id, category);
      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar questões por categoria.'
      });
    }
  };

  searchQuestions = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { search } = req.query;
      
      if (!search || typeof search !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Termo de busca é obrigatório.'
        });
      }

      const questions = await this.anamneseQuestionService.searchQuestions(user_id, search);
      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar questões.'
      });
    }
  };

  getStatistics = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const statistics = await this.anamneseQuestionService.getStatistics(user_id);
      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar estatísticas.'
      });
    }
  };
}


