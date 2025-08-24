import { supabase } from '../config/supabase';
import { PatientPlan, CreatePatientPlanDTO, UpdatePatientPlanDTO, PatientPlanFilters } from '../types/patientPlan';

export class PatientPlanService {
  async createPatientPlan(data: CreatePatientPlanDTO): Promise<PatientPlan> {
    const { data: plan, error } = await supabase
      .from('user_plans')
      .insert({
        user_id: data.user_id,
        name: data.name,
        plan_type: data.plan_type,
        sessions_monthly: data.sessions_monthly,
        sessions_max: data.sessions_max,
        price: data.price,
        notes: data.notes || '',
        status: data.status
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return plan;
  }

  async getPatientPlans(filters?: PatientPlanFilters): Promise<PatientPlan[]> {
    let query = supabase
      .from('user_plans')
      .select('*')
      .order('created_at', { ascending: false });

    // Aceita tanto user_id quanto userId para compatibilidade
    const userId = filters?.user_id || filters?.userId;
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }

    const { data: plans, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return plans || [];
  }

  async getPatientPlanById(id: string): Promise<PatientPlan | null> {
    const { data: plan, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(error.message);
    }

    return plan;
  }

  async getPatientPlansByUserId(userId: string): Promise<PatientPlan[]> {
    return this.getPatientPlans({ user_id: userId });
  }

  async updatePatientPlan(id: string, data: UpdatePatientPlanDTO): Promise<PatientPlan> {
    const updateData: any = { ...data };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: plan, error } = await supabase
      .from('user_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return plan;
  }

  async deletePatientPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_plans')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async searchByName(user_id: string, name: string): Promise<PatientPlan[]> {
    const { data: plans, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user_id)
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return plans || [];
  }
} 