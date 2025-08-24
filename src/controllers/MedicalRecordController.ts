import { Request, Response } from 'express';
import { MedicalRecordService } from '../services/MedicalRecordService';

const medicalRecordService = new MedicalRecordService();

export class MedicalRecordController {
  async createMedicalRecord(req: Request, res: Response) {
    try {
      const { patient_id, professional_id, notes } = req.body;

      if (!patient_id || !professional_id) {
        return res.status(400).json({
          success: false,
          message: 'patient_id e professional_id são obrigatórios'
        });
      }

      const medicalRecord = await medicalRecordService.createMedicalRecord({
        patient_id,
        professional_id,
        notes: notes || ''
      });

      res.status(201).json({
        success: true,
        data: medicalRecord,
        message: 'Prontuário criado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async getMedicalRecords(req: Request, res: Response) {
    try {
      const medicalRecords = await medicalRecordService.getMedicalRecords();

      res.json({
        success: true,
        data: medicalRecords,
        message: 'Prontuários recuperados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async getMedicalRecordById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do prontuário é obrigatório'
        });
      }

      const medicalRecord = await medicalRecordService.getMedicalRecordById(id);

      if (!medicalRecord) {
        return res.status(404).json({
          success: false,
          message: 'Prontuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: medicalRecord,
        message: 'Prontuário recuperado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async getMedicalRecordsByProfessional(req: Request, res: Response) {
    try {
      const { professionalId } = req.params;

      if (!professionalId) {
        return res.status(400).json({
          success: false,
          message: 'ID do profissional é obrigatório'
        });
      }

      const medicalRecords = await medicalRecordService.getMedicalRecordsByProfessional(professionalId);

      res.json({
        success: true,
        data: medicalRecords,
        message: 'Prontuários do profissional recuperados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async getMedicalRecordsByPatient(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'ID do paciente é obrigatório'
        });
      }

      const medicalRecords = await medicalRecordService.getMedicalRecordsByPatient(patientId);

      res.json({
        success: true,
        data: medicalRecords,
        message: 'Prontuários do paciente recuperados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async updateMedicalRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do prontuário é obrigatório'
        });
      }

      if (!updateData.notes && !updateData.patient_id) {
        return res.status(400).json({
          success: false,
          message: 'Pelo menos um campo deve ser fornecido para atualização'
        });
      }

      const medicalRecord = await medicalRecordService.updateMedicalRecord(id, updateData);

      res.json({
        success: true,
        data: medicalRecord,
        message: 'Prontuário atualizado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async deleteMedicalRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do prontuário é obrigatório'
        });
      }

      await medicalRecordService.deleteMedicalRecord(id);

      res.json({
        success: true,
        message: 'Prontuário removido com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async searchMedicalRecords(req: Request, res: Response) {
    try {
      const { professionalId, searchTerm } = req.query;

      if (!professionalId || !searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'professionalId e searchTerm são obrigatórios'
        });
      }

      const medicalRecords = await medicalRecordService.searchMedicalRecords(
        professionalId as string,
        searchTerm as string
      );

      res.json({
        success: true,
        data: medicalRecords,
        message: 'Busca realizada com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async getMedicalRecordStatistics(req: Request, res: Response) {
    try {
      const { professionalId } = req.params;

      if (!professionalId) {
        return res.status(400).json({
          success: false,
          message: 'ID do profissional é obrigatório'
        });
      }

      const statistics = await medicalRecordService.getMedicalRecordStatistics(professionalId);

      res.json({
        success: true,
        data: statistics,
        message: 'Estatísticas recuperadas com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }
}
