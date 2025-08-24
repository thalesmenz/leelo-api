import { Request, Response } from 'express';
import { AccountsReceivableService } from '../services/AccountsReceivableService';
import { CreateAccountsReceivableDTO, UpdateAccountsReceivableDTO } from '../types/accountsReceivable';

export class AccountsReceivableController {
  private accountsReceivableService: AccountsReceivableService;

  constructor() {
    this.accountsReceivableService = new AccountsReceivableService();
  }

  createAccountsReceivable = async (req: Request, res: Response) => {
    try {
      const receivableData: CreateAccountsReceivableDTO = req.body;
      
      // Validate required fields
      if (!receivableData.user_id || !receivableData.name || !receivableData.description || 
          !receivableData.amount || !receivableData.due_date) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos.'
        });
      }

      // Validate amount
      if (receivableData.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O valor deve ser maior que zero.'
        });
      }

      const result = await this.accountsReceivableService.createAccountsReceivable(receivableData);
      res.status(201).json({
        success: true,
        message: 'Conta a receber criada com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar conta a receber.'
      });
    }
  };

  getAccountsReceivable = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      
      // Validar se user_id está presente
      if (!filters.user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id é obrigatório para buscar contas a receber.'
        });
      }

      const receivables = await this.accountsReceivableService.getAccountsReceivable(filters);
      res.status(200).json({
        success: true,
        data: receivables,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar contas a receber.'
      });
    }
  };

  getAccountsReceivableById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const receivable = await this.accountsReceivableService.getAccountsReceivableById(id);
      
      if (!receivable) {
        return res.status(404).json({
          success: false,
          message: 'Conta a receber não encontrada.'
        });
      }

      res.status(200).json({
        success: true,
        data: receivable,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar conta a receber.'
      });
    }
  };

  updateAccountsReceivable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const receivableData: UpdateAccountsReceivableDTO = req.body;

      // Validate amount if provided
      if (receivableData.amount !== undefined && receivableData.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O valor deve ser maior que zero.'
        });
      }

      const result = await this.accountsReceivableService.updateAccountsReceivable(id, receivableData);
      
      // Mensagem personalizada baseada na alteração
      let message = 'Conta a receber atualizada com sucesso!';
      if (receivableData.status === 'pendente') {
        message = 'Conta a receber marcada como pendente! Transação financeira removida automaticamente.';
      }

      res.status(200).json({
        success: true,
        message,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar conta a receber.'
      });
    }
  };

  deleteAccountsReceivable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.accountsReceivableService.deleteAccountsReceivable(id);
      res.status(200).json({
        success: true,
        message: 'Conta a receber removida com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover conta a receber.'
      });
    }
  };

  markAsReceived = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { receive_date } = req.body;
      
      const result = await this.accountsReceivableService.markAsReceived(id, receive_date);
      res.status(200).json({
        success: true,
        message: 'Conta a receber marcada como recebida! Transação financeira criada automaticamente.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao marcar conta como recebida.'
      });
    }
  };

  getStatistics = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const statistics = await this.accountsReceivableService.getStatistics(user_id);
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

      const receivables = await this.accountsReceivableService.searchByName(user_id, name);
      res.status(200).json({
        success: true,
        data: receivables,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar contas a receber.'
      });
    }
  };
} 