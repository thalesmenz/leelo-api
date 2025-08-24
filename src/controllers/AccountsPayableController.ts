import { Request, Response } from 'express';
import { AccountsPayableService } from '../services/AccountsPayableService';
import { CreateAccountsPayableDTO, UpdateAccountsPayableDTO } from '../types/accountsPayable';

export class AccountsPayableController {
  private accountsPayableService: AccountsPayableService;

  constructor() {
    this.accountsPayableService = new AccountsPayableService();
  }

  createAccountsPayable = async (req: Request, res: Response) => {
    try {
      const payableData: CreateAccountsPayableDTO = req.body;
      
      // Validate required fields
      if (!payableData.user_id || !payableData.name || !payableData.description || 
          !payableData.amount || !payableData.due_date) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos.'
        });
      }

      // Validate amount
      if (payableData.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O valor deve ser maior que zero.'
        });
      }

      const result = await this.accountsPayableService.createAccountsPayable(payableData);
      res.status(201).json({
        success: true,
        message: 'Conta a pagar criada com sucesso!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar conta a pagar.'
      });
    }
  };

  getAccountsPayable = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      
      // Validar se user_id está presente
      if (!filters.user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id é obrigatório para buscar contas a pagar.'
        });
      }

      const payables = await this.accountsPayableService.getAccountsPayable(filters);
      res.status(200).json({
        success: true,
        data: payables,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar contas a pagar.'
      });
    }
  };

  getAccountsPayableById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payable = await this.accountsPayableService.getAccountsPayableById(id);
      
      if (!payable) {
        return res.status(404).json({
          success: false,
          message: 'Conta a pagar não encontrada.'
        });
      }

      res.status(200).json({
        success: true,
        data: payable,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar conta a pagar.'
      });
    }
  };

  updateAccountsPayable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payableData: UpdateAccountsPayableDTO = req.body;

      // Validate amount if provided
      if (payableData.amount !== undefined && payableData.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O valor deve ser maior que zero.'
        });
      }

      const result = await this.accountsPayableService.updateAccountsPayable(id, payableData);
      
      // Mensagem personalizada baseada na alteração
      let message = 'Conta a pagar atualizada com sucesso!';
      if (payableData.status === 'pendente') {
        message = 'Conta a pagar marcada como pendente! Transação financeira removida automaticamente.';
      }

      res.status(200).json({
        success: true,
        message,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar conta a pagar.'
      });
    }
  };

  deleteAccountsPayable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.accountsPayableService.deleteAccountsPayable(id);
      res.status(200).json({
        success: true,
        message: 'Conta a pagar removida com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover conta a pagar.'
      });
    }
  };

  markAsPaid = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { payment_date } = req.body;
      
      const result = await this.accountsPayableService.markAsPaid(id, payment_date);
      res.status(200).json({
        success: true,
        message: 'Conta a pagar marcada como paga! Transação financeira criada automaticamente.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao marcar conta como paga.'
      });
    }
  };

  getStatistics = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const statistics = await this.accountsPayableService.getStatistics(user_id);
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

      const payables = await this.accountsPayableService.searchByName(user_id, name);
      res.status(200).json({
        success: true,
        data: payables,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar contas a pagar.'
      });
    }
  };
} 