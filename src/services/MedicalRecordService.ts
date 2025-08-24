import { supabase } from '../config/supabase';
import { CreateMedicalRecordDTO, UpdateMedicalRecordDTO, MedicalRecordWithPatient, MedicalRecordStatistics } from '../types/medicalRecord';

export class MedicalRecordService {
  async createMedicalRecord(recordData: CreateMedicalRecordDTO) {
    if (!recordData.patient_id || !recordData.professional_id) {
      throw new Error('patient_id e professional_id são obrigatórios para criar um prontuário.');
    }

    const { data, error } = await supabase
      .from('medical_records')
      .insert(recordData)
      .select()
      .single();
    
    if (error) throw new Error(error.message || 'Erro ao criar prontuário.');
    return data;
  }

  async getMedicalRecords() {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*');
    
    if (error) throw new Error(error.message || 'Erro ao buscar prontuários.');
    return data;
  }

  async getMedicalRecordById(recordId: string) {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (error) throw new Error(error.message || 'Erro ao buscar prontuário.');
    return data;
  }

  async getMedicalRecordsByProfessional(professionalId: string) {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patients!inner(name, cpf),
        users_accounts!inner(name)
      `)
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message || 'Erro ao buscar prontuários do profissional.');
    
    // Mapear dados para o formato esperado
    return data?.map(record => ({
      id: record.id,
      patient_id: record.patient_id,
      professional_id: record.professional_id,
      notes: record.notes,
      created_at: record.created_at,
      patient_name: record.patients?.name || '',
      patient_cpf: record.patients?.cpf || '',
      professional_name: record.users_accounts?.name || ''
    })) || [];
  }

  async getMedicalRecordsByPatient(patientId: string) {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patients!inner(name, cpf),
        users_accounts!inner(name)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message || 'Erro ao buscar prontuários do paciente.');
    
    // Mapear dados para o formato esperado
    return data?.map(record => ({
      id: record.id,
      patient_id: record.patient_id,
      professional_id: record.professional_id,
      notes: record.notes,
      created_at: record.created_at,
      patient_name: record.patients?.name || '',
      patient_cpf: record.patients?.cpf || '',
      professional_name: record.users_accounts?.name || ''
    })) || [];
  }

  async updateMedicalRecord(recordId: string, recordData: UpdateMedicalRecordDTO) {
    const { data, error } = await supabase
      .from('medical_records')
      .update(recordData)
      .eq('id', recordId)
      .select()
      .single();
    
    if (error) throw new Error(error.message || 'Erro ao atualizar prontuário.');
    return data;
  }

  async deleteMedicalRecord(recordId: string) {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId);
    
    if (error) throw new Error(error.message || 'Erro ao remover prontuário.');
    return true;
  }

  async searchMedicalRecords(professionalId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patients!inner(name, cpf),
        users_accounts!inner(name)
      `)
      .eq('professional_id', professionalId)
      .or(`patients.name.ilike.%${searchTerm}%,patients.cpf.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message || 'Erro ao buscar prontuários.');
    
    // Mapear dados para o formato esperado
    return data?.map(record => ({
      id: record.id,
      patient_id: record.patient_id,
      professional_id: record.professional_id,
      notes: record.notes,
      created_at: record.created_at,
      patient_name: record.patients?.name || '',
      patient_cpf: record.patients?.cpf || '',
      professional_name: record.users_accounts?.name || ''
    })) || [];
  }

  async getMedicalRecordStatistics(professionalId: string): Promise<MedicalRecordStatistics> {
    // Buscar todos os prontuários do profissional
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('professional_id', professionalId);
    
    if (recordsError) throw new Error(recordsError.message || 'Erro ao buscar prontuários.');
    
    const totalRecords = records?.length || 0;
    
    // Calcular prontuários por paciente
    const recordsByPatient: Record<string, number> = {};
    records?.forEach(record => {
      recordsByPatient[record.patient_id] = (recordsByPatient[record.patient_id] || 0) + 1;
    });
    
    // Calcular prontuários por profissional (neste caso, sempre será 1 por ser o mesmo)
    const recordsByProfessional: Record<string, number> = {};
    recordsByProfessional[professionalId] = totalRecords;
    
    // Calcular prontuários recentes (últimos 30 dias)
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentRecords = records?.filter(record => {
      const createdAt = new Date(record.created_at);
      return createdAt >= thirtyDaysAgo;
    }).length || 0;
    
    return {
      total_records: totalRecords,
      records_by_patient: recordsByPatient,
      records_by_professional: recordsByProfessional,
      recent_records: recentRecords
    };
  }
}
