import { Request, Response } from 'express';
import { AppointmentService } from '../services/AppointmentService';
import { CreateAppointmentDTO, UpdateAppointmentDTO } from '../types/appointment';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  createAppointment = async (req: Request, res: Response) => {
    try {
      const appointmentData: CreateAppointmentDTO = req.body;
      
      // Validate required fields
      if (!appointmentData.user_id || !appointmentData.service_id || 
          !appointmentData.patient_cpf || !appointmentData.patient_name ||
          !appointmentData.start_time || !appointmentData.end_time) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos.'
        });
      }

      // Check for conflicts
      const hasConflicts = await this.appointmentService.checkConflicts(
        appointmentData.user_id,
        appointmentData.start_time,
        appointmentData.end_time
      );

      if (hasConflicts) {
        return res.status(409).json({
          success: false,
          message: 'Existe um conflito de horário para este agendamento.'
        });
      }

      const result = await this.appointmentService.createAppointment(appointmentData);
      res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar agendamento.'
      });
    }
  };

  createAppointmentWithoutConflictCheck = async (req: Request, res: Response) => {
    try {
      const appointmentData: CreateAppointmentDTO = req.body;
      
      // Validate required fields
      if (!appointmentData.user_id || !appointmentData.service_id || 
          !appointmentData.patient_cpf || !appointmentData.patient_name ||
          !appointmentData.start_time || !appointmentData.end_time) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos.'
        });
      }

      // Check for conflicts but don't block - just return conflict info
      const hasConflicts = await this.appointmentService.checkConflicts(
        appointmentData.user_id,
        appointmentData.start_time,
        appointmentData.end_time
      );

      const result = await this.appointmentService.createAppointmentWithoutConflictCheck(appointmentData);
      res.status(201).json({
        success: true,
        message: hasConflicts ? 'Agendamento criado com conflito de horário.' : 'Agendamento criado com sucesso!',
        data: result,
        hasConflicts: hasConflicts
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar agendamento.'
      });
    }
  };

  getAppointments = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const appointments = await this.appointmentService.getAppointments(filters);
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar agendamentos.'
      });
    }
  };

  getAppointmentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const appointment = await this.appointmentService.getAppointmentById(id);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar agendamento.'
      });
    }
  };

  getAppointmentsByUserId = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const appointments = await this.appointmentService.getAppointmentsByUserId(user_id);
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar agendamentos do usuário.'
      });
    }
  };

  updateAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const appointmentData: UpdateAppointmentDTO = req.body;

      // Check if appointment exists
      const existingAppointment = await this.appointmentService.getAppointmentById(id);
      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado.'
        });
      }

      // Check for conflicts if time is being updated
      if (appointmentData.start_time && appointmentData.end_time) {
        const hasConflicts = await this.appointmentService.checkConflicts(
          existingAppointment.user_id,
          appointmentData.start_time,
          appointmentData.end_time,
          id
        );

        if (hasConflicts) {
          return res.status(409).json({
            success: false,
            message: 'Existe um conflito de horário para este agendamento.'
          });
        }
      }

      const updated = await this.appointmentService.updateAppointment(id, appointmentData);
      res.status(200).json({
        success: true,
        message: 'Agendamento atualizado com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar agendamento.'
      });
    }
  };

  deleteAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if appointment exists
      const existingAppointment = await this.appointmentService.getAppointmentById(id);
      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado.'
        });
      }

      await this.appointmentService.deleteAppointment(id);
      res.status(200).json({
        success: true,
        message: 'Agendamento removido com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover agendamento.'
      });
    }
  };

  updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'confirmed', 'canceled', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Deve ser: pending, confirmed, canceled ou completed.'
        });
      }

      // Check if appointment exists
      const existingAppointment = await this.appointmentService.getAppointmentById(id);
      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado.'
        });
      }

      const result = await this.appointmentService.updateAppointmentStatus(id, status);
      
      // Mensagem personalizada baseada no status e resultado da transação
      let message = 'Status do agendamento atualizado com sucesso!';
      
      if (status === 'completed') {
        if (result.transactionInfo?.action === 'created') {
          message = 'Agendamento concluído! Transação financeira criada automaticamente.';
        } else if (result.transactionInfo?.error) {
          message = 'Agendamento concluído, mas houve um erro ao criar a transação financeira.';
        } else {
          message = 'Agendamento concluído!';
        }
      } else if (status === 'pending') {
        if (result.transactionInfo?.action === 'deleted') {
          message = 'Agendamento marcado como pendente. Transação financeira removida.';
        } else if (result.transactionInfo?.error) {
          message = 'Agendamento marcado como pendente, mas houve um erro ao remover a transação financeira.';
        } else {
          message = 'Agendamento marcado como pendente.';
        }
      } else if (status === 'canceled') {
        if (result.transactionInfo?.action === 'deleted') {
          message = 'Agendamento cancelado. Transação financeira removida.';
        } else if (result.transactionInfo?.error) {
          message = 'Agendamento cancelado, mas houve um erro ao remover a transação financeira.';
        } else {
          message = 'Agendamento cancelado.';
        }
      } else if (status === 'confirmed') {
        if (result.transactionInfo?.action === 'deleted') {
          message = 'Agendamento confirmado. Transação financeira removida.';
        } else if (result.transactionInfo?.error) {
          message = 'Agendamento confirmado, mas houve um erro ao remover a transação financeira.';
        } else {
          message = 'Agendamento confirmado.';
        }
      }
      
      res.status(200).json({
        success: true,
        message,
        data: result.appointment,
        transactionInfo: result.transactionInfo,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar status do agendamento.'
      });
    }
  };

  getAvailableSlots = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { date, service_id } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Data é obrigatória para buscar horários disponíveis.'
        });
      }

      const slots = await this.appointmentService.getAvailableSlots(
        user_id, 
        date, 
        service_id as string
      );

      res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar horários disponíveis.'
      });
    }
  };
} 