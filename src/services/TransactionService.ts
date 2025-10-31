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

  async getStatistics(user_id: string, month?: number, year?: number) {
    // Determinar período para filtro
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id);

    // Se month e year foram fornecidos, filtrar por período específico
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      const startOfPrevMonth = new Date(year, month - 2, 1);
      const endOfPrevMonth = new Date(year, month - 1, 0);
      
      query = query
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);
    }

    const { data: transactions, error } = await query;
    
    if (error) throw new Error(error.message);

    // Buscar transações do mês anterior para comparação
    let prevMonthTransactions: any[] = [];
    if (month && year) {
      const startOfPrevMonth = new Date(year, month - 2, 1);
      const endOfPrevMonth = new Date(year, month - 1, 0);
      
      const { data: prevData, error: prevError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user_id)
        .gte('date', startOfPrevMonth.toISOString().split('T')[0])
        .lte('date', endOfPrevMonth.toISOString().split('T')[0]);
      
      if (!prevError) {
        prevMonthTransactions = prevData || [];
      }
    }

    // Calcular receitas (entradas) do mês selecionado
    const receitaMes = transactions?.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    
    // Calcular despesas (saídas) do mês selecionado
    const despesasMes = transactions?.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    
    // Calcular lucro (receitas - despesas)
    const lucroMes = receitaMes - despesasMes;

    // Calcular valores do mês anterior
    const receitaMesAnterior = prevMonthTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount), 0);
    const despesasMesAnterior = prevMonthTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount), 0);
    const lucroMesAnterior = receitaMesAnterior - despesasMesAnterior;

    // Calcular percentuais
    const receitaPercent = receitaMesAnterior ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 : null;
    const despesasPercent = despesasMesAnterior ? ((despesasMes - despesasMesAnterior) / despesasMesAnterior) * 100 : null;
    const lucroPercent = lucroMesAnterior ? ((lucroMes - lucroMesAnterior) / Math.abs(lucroMesAnterior)) * 100 : null;

    // Receita de hoje (usando timezone do Brasil)
    const now = new Date();
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3 (horário de Brasília)
    const today = brazilTime.toISOString().split('T')[0];
    
    const receitaHoje = transactions?.filter(t => t.type === 'entrada' && t.date.startsWith(today)).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const atendimentosHoje = transactions?.filter(t => t.type === 'entrada' && t.date.startsWith(today)).length || 0;

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