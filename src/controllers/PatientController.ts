import { Request, Response } from 'express';
import { PatientService } from '../services/PatientService';

export class PatientController {
  private patientService: PatientService;

  constructor() {
    this.patientService = new PatientService();
  }

  createPatient = async (req: Request, res: Response) => {
    try {
      const patientData = req.body;
      const result = await this.patientService.createPatient(patientData);
      res.status(201).json({
        success: true,
        message: 'Paciente criado com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar paciente.'
      });
    }
  };

  getPatients = async (req: Request, res: Response) => {
    try {
      const patients = await this.patientService.getPatients();
      res.status(200).json({
        success: true,
        data: patients,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar pacientes.'
      });
    }
  };

  getPatientByUserId = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const patient = await this.patientService.getPatientByUserId(user_id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado.'
        });
      }
      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar paciente.'
      });
    }
  };

  updatePatientByUserId = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const patientData = req.body;
      const updated = await this.patientService.updatePatientByUserId(user_id, patientData);
      res.status(200).json({
        success: true,
        message: 'Paciente atualizado com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar paciente.'
      });
    }
  };

  deletePatientByUserId = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      await this.patientService.deletePatientByUserId(user_id);
      res.status(200).json({
        success: true,
        message: 'Paciente removido com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover paciente.'
      });
    }
  };

  deletePatientById = async (req: Request, res: Response) => {
    try {
      const { patient_id } = req.params;
      await this.patientService.deletePatientById(patient_id);
      res.status(200).json({
        success: true,
        message: 'Paciente removido com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover paciente.'
      });
    }
  };

  getPatientById = async (req: Request, res: Response) => {
    try {
      const { patient_id } = req.params;
      const patient = await this.patientService.getPatientById(patient_id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado.'
        });
      }
      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar paciente.'
      });
    }
  };

  getPatientsByName = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { name } = req.query;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório para a busca.'
        });
      }

      const patients = await this.patientService.getPatientsByName(user_id, name);
      res.status(200).json({
        success: true,
        data: patients,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar pacientes.'
      });
    }
  };

  getPatientStatistics = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const statistics = await this.patientService.getPatientStatistics(user_id);
      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar estatísticas de pacientes.'
      });
    }
  };
} 