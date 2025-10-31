import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { CreateTransactionDTO, UpdateTransactionDTO } from '../types/transaction';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  createTransaction = async (req: Request, res: Response) => {
    try {
      const transactionData: CreateTransactionDTO = req.body;
      if (!transactionData.user_id || !transactionData.date || !transactionData.type || !transactionData.origin || !transactionData.amount) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios não preenchidos.' });
      }
      const result = await this.transactionService.createTransaction(transactionData);
      res.status(201).json({ success: true, message: 'Transação criada com sucesso!', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao criar transação.' });
    }
  };

  getTransactions = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      if (!filters.user_id) {
        return res.status(400).json({ success: false, message: 'user_id é obrigatório para buscar transações.' });
      }
      const transactions = await this.transactionService.getTransactions(filters);
      res.status(200).json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao buscar transações.' });
    }
  };

  getTransactionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transaction = await this.transactionService.getTransactionById(id);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transação não encontrada.' });
      }
      res.status(200).json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao buscar transação.' });
    }
  };

  updateTransaction = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transactionData: UpdateTransactionDTO = req.body;
      const result = await this.transactionService.updateTransaction(id, transactionData);
      res.status(200).json({ success: true, message: 'Transação atualizada com sucesso!', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao atualizar transação.' });
    }
  };

  deleteTransaction = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.transactionService.deleteTransaction(id);
      res.status(200).json({ success: true, message: 'Transação removida com sucesso!' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao remover transação.' });
    }
  };

  getStatistics = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { month, year } = req.query;
      
      // Se month e year foram fornecidos, usa eles
      let parsedMonth: number | undefined;
      let parsedYear: number | undefined;
      
      if (month) {
        parsedMonth = parseInt(month as string);
      }
      if (year) {
        parsedYear = parseInt(year as string);
      }
      
      const stats = await this.transactionService.getStatistics(user_id, parsedMonth, parsedYear);
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao buscar estatísticas.' });
    }
  };

  getHistoricalData = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { months = 6 } = req.query;
      const historicalData = await this.transactionService.getHistoricalData(user_id, Number(months));
      res.status(200).json({ success: true, data: historicalData });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao buscar dados históricos.' });
    }
  };

  searchByDescription = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      const { description } = req.query;
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Descrição é obrigatória para a busca.'
        });
      }

      const transactions = await this.transactionService.searchByDescription(user_id, description);
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar transações.'
      });
    }
  };
} 