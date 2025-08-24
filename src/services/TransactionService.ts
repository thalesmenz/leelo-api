import { supabase } from '../config/supabase';
import { Transaction, CreateTransactionDTO, UpdateTransactionDTO } from '../types/transaction';

export class TransactionService {
  async createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transaction;
  }

  async getTransactions(filters: any = {}): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        user:users_accounts(name, email)
      `);

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.origin) query = query.eq('origin', filters.origin);
    if (filters.start_date) query = query.gte('date', filters.start_date);
    if (filters.end_date) query = query.lte('date', filters.end_date);

    query = query.order('date', { ascending: false });

    const { data: transactions, error } = await query;
    if (error) throw new Error(error.message);
    return transactions || [];
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return transaction;
  }

  async getStatistics(user_id: string) {
    // Datas
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const today = now.toISOString().split('T')[0];

    // Transações do mês atual
    const { data: monthTransactions, error: monthError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0]);
    if (monthError) throw new Error(monthError.message);

    // Transações do mês anterior
    const { data: prevMonthTransactions, error: prevMonthError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', startOfPrevMonth.toISOString().split('T')[0])
      .lte('date', endOfPrevMonth.toISOString().split('T')[0]);
    if (prevMonthError) throw new Error(prevMonthError.message);

    // Transações de hoje
    const { data: todayTransactions, error: todayError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', today);
    if (todayError) throw new Error(todayError.message);

    // Cálculos mês atual
    const receitaMes = monthTransactions?.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const despesasMes = monthTransactions?.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const lucroMes = receitaMes - despesasMes;

    // Cálculos mês anterior
    const receitaMesAnterior = prevMonthTransactions?.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const despesasMesAnterior = prevMonthTransactions?.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const lucroMesAnterior = receitaMesAnterior - despesasMesAnterior;

    // Receita de hoje
    const receitaHoje = todayTransactions?.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const atendimentosHoje = todayTransactions?.filter(t => t.type === 'entrada').length || 0;

    // Percentuais
    const receitaPercent = receitaMesAnterior ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 : null;
    const despesasPercent = despesasMesAnterior ? ((despesasMes - despesasMesAnterior) / despesasMesAnterior) * 100 : null;
    const lucroPercent = lucroMesAnterior ? ((lucroMes - lucroMesAnterior) / Math.abs(lucroMesAnterior)) * 100 : null;

    return {
      receitaMes,
      despesasMes,
      lucroMes,
      receitaHoje,
      atendimentosHoje,
      receitaPercent,
      despesasPercent,
      lucroPercent
    };
  }

  async getHistoricalData(user_id: string, months: number = 6) {
    const historicalData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      
      const { data: monthTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user_id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);
      
      if (error) throw new Error(error.message);
      
      const receita = monthTransactions?.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
      let despesas = monthTransactions?.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount), 0);
      if (typeof despesas !== 'number' || isNaN(despesas)) despesas = 0;
      const lucro = receita - despesas;
      
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      historicalData.push({
        month: monthNames[targetDate.getMonth()],
        revenue: receita,
        profit: lucro,
        expenses: despesas || 0
      });
    }
    
    return historicalData;
  }

  async updateTransaction(id: string, data: UpdateTransactionDTO): Promise<Transaction> {
    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getTransactionByOriginId(origin_id: string, origin: string): Promise<Transaction | null> {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('origin_id', origin_id)
      .eq('origin', origin)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return transaction;
  }

  async deleteTransactionByOriginId(origin_id: string, origin: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('origin_id', origin_id)
      .eq('origin', origin);
    if (error) throw new Error(error.message);
  }

  async searchByDescription(user_id: string, description: string): Promise<Transaction[]> {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .ilike('description', `%${description}%`)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return transactions || [];
  }
} 