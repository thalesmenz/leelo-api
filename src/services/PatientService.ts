import { supabase } from '../config/supabase';

export class PatientService {
  async createPatient(patientData: any) {
    if (!patientData.user_id) {
      throw new Error('user_id é obrigatório para criar um paciente.');
    }

    // Verifica se já existe paciente com o mesmo CPF para o user_id
    const { data: existing, error: findError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', patientData.user_id)
      .eq('cpf', patientData.cpf)
      .maybeSingle();

    if (findError) throw new Error(findError.message || 'Erro ao verificar paciente existente.');
    if (existing) throw new Error('Já existe um paciente com este CPF para este usuário.');

    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single();
    if (error) throw new Error(error.message || 'Erro ao criar paciente.');
    return data;
  }

  async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*');
    if (error) throw new Error(error.message || 'Erro ao buscar pacientes.');
    return data;
  }

  async getPatientByUserId(userId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId);
    if (error) throw new Error(error.message || 'Erro ao buscar pacientes.');
    return data;
  }

  async updatePatientByUserId(userId: string, patientData: any) {
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message || 'Erro ao atualizar paciente.');
    return data;
  }

  async deletePatientByUserId(userId: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('user_id', userId);
    if (error) throw new Error(error.message || 'Erro ao remover paciente.');
    return true;
  }

  async deletePatientById(patientId: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);
    if (error) throw new Error(error.message || 'Erro ao remover paciente.');
    return true;
  }

  async getPatientById(patientId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();
    if (error) throw new Error(error.message || 'Erro ao buscar paciente.');
    return data;
  }

  async getPatientsByName(userId: string, name: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${name}%`);
    if (error) throw new Error(error.message || 'Erro ao buscar pacientes.');
    return data;
  }

  async getPatientStatistics(userId: string) {
    // Buscar todos os pacientes do usuário
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId);
    
    if (patientsError) throw new Error(patientsError.message || 'Erro ao buscar pacientes.');
    
    const totalPatients = patients?.length || 0;
    
    // Calcular novos pacientes deste mês
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const newPatientsThisMonth = patients?.filter(patient => {
      const createdAt = new Date(patient.created_at);
      return createdAt >= firstDayOfMonth;
    }).length || 0;
    
    // Calcular pacientes ativos (com status "Ativo")
    const activePatients = patients?.filter(patient => patient.status === 'Ativo').length || 0;
    
    return {
      totalPatients,
      newPatientsThisMonth,
      activePatients
    };
  }
} 