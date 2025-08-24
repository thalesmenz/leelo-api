import { Request, Response } from 'express';
import { UserServiceService } from '../services/UserService';
import { CreateUserServiceDTO, UpdateUserServiceDTO } from '../types/service';

export class UserServiceController {
  private userServiceService: UserServiceService;

  constructor() {
    this.userServiceService = new UserServiceService();
  }

  createService = async (req: Request, res: Response) => {
    try {
      const serviceData: CreateUserServiceDTO = req.body;
      
      // Validate required fields
      if (!serviceData.user_id || !serviceData.name || 
          !serviceData.duration || serviceData.price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos.'
        });
      }

      const result = await this.userServiceService.createService(serviceData);
      res.status(201).json({
        success: true,
        message: 'Serviço criado com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar serviço.'
      });
    }
  };

  getServicesByUserId = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const services = await this.userServiceService.getServicesByUserId(user_id);
      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar serviços.'
      });
    }
  };

  getServiceById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const service = await this.userServiceService.getServiceById(id);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar serviço.'
      });
    }
  };

  updateService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const serviceData: UpdateUserServiceDTO = req.body;

      // Check if service exists
      const existingService = await this.userServiceService.getServiceById(id);
      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado.'
        });
      }

      const updated = await this.userServiceService.updateService(id, serviceData);
      res.status(200).json({
        success: true,
        message: 'Serviço atualizado com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar serviço.'
      });
    }
  };

  deleteService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if service exists
      const existingService = await this.userServiceService.getServiceById(id);
      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado.'
        });
      }

      await this.userServiceService.deleteService(id);
      res.status(200).json({
        success: true,
        message: 'Serviço removido com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover serviço.'
      });
    }
  };

  toggleServiceStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if service exists
      const existingService = await this.userServiceService.getServiceById(id);
      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado.'
        });
      }

      const updated = await this.userServiceService.toggleServiceStatus(id);
      res.status(200).json({
        success: true,
        message: 'Status do serviço atualizado com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar status do serviço.'
      });
    }
  };
} 