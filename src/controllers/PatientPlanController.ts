import { Request, Response } from 'express';
import { PatientPlanService } from '../services/PatientPlanService';
import { CreatePatientPlanDTO, UpdatePatientPlanDTO } from '../types/patientPlan';

export class PatientPlanController {
  private patientPlanService: PatientPlanService;

  constructor() {
    this.patientPlanService = new PatientPlanService();
  }

  createPatientPlan = async (req: Request, res: Response) => {
    try {
      const planData: CreatePatientPlanDTO = req.body;
      
      // Mapear userId para user_id se necessário
      if (planData.userId && !planData.user_id) {
        planData.user_id = planData.userId;
      }
      
      // Validate required fields
      if (!planData.user_id || !planData.name || 
          !planData.plan_type || !planData.price) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos.'
        });
      }

      // Validate plan_type
      if (!['recorrente', 'sessoes'].includes(planData.plan_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de plano deve ser "recorrente" ou "sessoes".'
        });
      }

      // Validate sessions based on plan_type
      if (planData.plan_type === 'recorrente' && (!planData.sessions_monthly || planData.sessions_monthly <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Para planos recorrentes, o número de sessões mensais deve ser maior que zero.'
        });
      }

      if (planData.plan_type === 'sessoes' && (!planData.sessions_max || planData.sessions_max <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Para planos por sessões, o número máximo de sessões deve ser maior que zero.'
        });
      }

      if (planData.price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O preço deve ser maior que zero.'
        });
      }

      const result = await this.patientPlanService.createPatientPlan(planData);
      res.status(201).json({
        success: true,
        message: 'Plano de paciente criado com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar plano de paciente.'
      });
    }
  };

  getPatientPlans = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const plans = await this.patientPlanService.getPatientPlans(filters);
      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar planos de pacientes.'
      });
    }
  };

  getPatientPlanById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const plan = await this.patientPlanService.getPatientPlanById(id);
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plano de paciente não encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar plano de paciente.'
      });
    }
  };

  getPatientPlansByUserId = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const plans = await this.patientPlanService.getPatientPlansByUserId(user_id);
      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar planos de pacientes do usuário.'
      });
    }
  };

  updatePatientPlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const planData: UpdatePatientPlanDTO = req.body;

      // Check if plan exists
      const existingPlan = await this.patientPlanService.getPatientPlanById(id);
      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plano de paciente não encontrado.'
        });
      }

      // Validate plan_type if provided
      if (planData.plan_type && !['recorrente', 'sessoes'].includes(planData.plan_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de plano deve ser "recorrente" ou "sessoes".'
        });
      }

      // Validate sessions based on plan_type if provided
      if (planData.plan_type === 'recorrente' && planData.sessions_monthly !== undefined && planData.sessions_monthly <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Para planos recorrentes, o número de sessões mensais deve ser maior que zero.'
        });
      }

      if (planData.plan_type === 'sessoes' && planData.sessions_max !== undefined && planData.sessions_max <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Para planos por sessões, o número máximo de sessões deve ser maior que zero.'
        });
      }

      if (planData.price !== undefined && planData.price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O preço deve ser maior que zero.'
        });
      }

      const updated = await this.patientPlanService.updatePatientPlan(id, planData);
      res.status(200).json({
        success: true,
        message: 'Plano de paciente atualizado com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar plano de paciente.'
      });
    }
  };

  deletePatientPlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if plan exists
      const existingPlan = await this.patientPlanService.getPatientPlanById(id);
      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plano de paciente não encontrado.'
        });
      }

      await this.patientPlanService.deletePatientPlan(id);
      res.status(200).json({
        success: true,
        message: 'Plano de paciente removido com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover plano de paciente.'
      });
    }
  };

  searchByName = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { name } = req.query;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório para a busca.'
        });
      }

      const plans = await this.patientPlanService.searchByName(user_id, name);
      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar planos de pacientes.'
      });
    }
  };
} 