import { Request, Response } from 'express';
import { SubuserService } from '../services/SubuserService';

export class SubuserController {
  private subuserService: SubuserService;

  constructor() {
    this.subuserService = new SubuserService();
  }

  createSubuser = async (req: Request, res: Response) => {
    try {
      const subuserData = req.body;
      const result = await this.subuserService.createSubuser(subuserData);
      res.status(201).json({
        success: true,
        message: 'Subusuário criado com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar subusuário.'
      });
    }
  };

  getSubusersByParentId = async (req: Request, res: Response) => {
    try {
      const { parent_id } = req.params;
      const subusers = await this.subuserService.getSubusersByParentId(parent_id);
      res.status(200).json({
        success: true,
        data: subusers,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar subusuários.'
      });
    }
  };

  getSubuserById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const subuser = await this.subuserService.getSubuserById(id);
      if (!subuser) {
        return res.status(404).json({
          success: false,
          message: 'Subusuário não encontrado.'
        });
      }
      res.status(200).json({
        success: true,
        data: subuser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar subusuário.'
      });
    }
  };

  updateSubuser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const subuserData = req.body;
      const updated = await this.subuserService.updateSubuser(id, subuserData);
      res.status(200).json({
        success: true,
        message: 'Subusuário atualizado com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar subusuário.'
      });
    }
  };

  deleteSubuser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.subuserService.deleteSubuser(id);
      res.status(200).json({
        success: true,
        message: 'Subusuário removido com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover subusuário.'
      });
    }
  };

  getParentUser = async (req: Request, res: Response) => {
    try {
      const { subuser_id } = req.params;
      const parentUser = await this.subuserService.getParentUser(subuser_id);
      if (!parentUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário pai não encontrado.'
        });
      }
      res.status(200).json({
        success: true,
        data: parentUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar usuário pai.'
      });
    }
  };

  // Novos métodos seguindo o padrão da aplicação

  getSubuserTransactions = async (req: Request, res: Response) => {
    try {
      const { subuser_id } = req.params;
      const transactions = await this.subuserService.getSubuserTransactions(subuser_id);
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar transações do subusuário.'
      });
    }
  };

  getSubuserAccountsPayable = async (req: Request, res: Response) => {
    try {
      const { subuser_id } = req.params;
      const accountsPayable = await this.subuserService.getSubuserAccountsPayable(subuser_id);
      res.status(200).json({
        success: true,
        data: accountsPayable,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar contas a pagar do subusuário.'
      });
    }
  };

  getSubuserAccountsReceivable = async (req: Request, res: Response) => {
    try {
      const { subuser_id } = req.params;
      const accountsReceivable = await this.subuserService.getSubuserAccountsReceivable(subuser_id);
      res.status(200).json({
        success: true,
        data: accountsReceivable,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar contas a receber do subusuário.'
      });
    }
  };

  getAllSubusersConsolidatedData = async (req: Request, res: Response) => {
    try {
      const { parent_id } = req.params;
      const consolidatedData = await this.subuserService.getAllSubusersConsolidatedData(parent_id);
      res.status(200).json({
        success: true,
        data: consolidatedData,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar dados consolidados dos subusuários.'
      });
    }
  };
} 