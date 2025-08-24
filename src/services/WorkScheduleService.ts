import { supabase } from '../config/supabase';
import { WorkSchedule, WorkScheduleUpsert } from '../types/workSchedule';

const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export class WorkScheduleService {
  async getByUser(user_id: string): Promise<WorkSchedule[]> {
    const { data, error } = await supabase
      .from('user_schedules')
      .select('*')
      .eq('user_id', user_id)
      .order('day_of_week', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getDay(user_id: string, day_of_week: string): Promise<WorkSchedule | null> {
    const { data, error } = await supabase
      .from('user_schedules')
      .select('*')
      .eq('user_id', user_id)
      .eq('day_of_week', day_of_week)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = no rows
    return data || null;
  }

  async upsertMany(user_id: string, schedules: any[]): Promise<WorkSchedule[]> {
    // Ajusta os campos para bater com a tabela
    const payload = schedules.map((s: any, idx: number) => ({
      user_id,
      day_of_week: s.day_of_week ?? dayNames[s.weekday ?? idx] ?? '',
      is_active: s.is_active ?? s.active,
      start_time: s.start_time ?? s.start,
      end_time: s.end_time ?? s.end,
      has_lunch_break: s.has_lunch_break ?? s.hasLunch,
      lunch_start_time: s.lunch_start_time ?? s.lunchStart,
      lunch_end_time: s.lunch_end_time ?? s.lunchEnd,
      slot_interval: s.slot_interval ?? 30, // padrão 30 minutos
    }));
    const { data, error } = await supabase
      .from('user_schedules')
      .upsert(payload, { onConflict: 'user_id,day_of_week' })
      .select('*');
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateDay(user_id: string, day_of_week: string, data: Partial<any>): Promise<WorkSchedule> {
    // Ajusta os campos para bater com a tabela
    const updateData: any = {
      ...data,
      is_active: data.is_active ?? data.active,
      start_time: data.start_time ?? data.start,
      end_time: data.end_time ?? data.end,
      has_lunch_break: data.has_lunch_break ?? data.hasLunch,
      lunch_start_time: data.lunch_start_time ?? data.lunchStart,
      lunch_end_time: data.lunch_end_time ?? data.lunchEnd,
      slot_interval: data.slot_interval ?? 60, // padrão 60 minutos
    };
    const { data: updated, error } = await supabase
      .from('user_schedules')
      .update(updateData)
      .eq('user_id', user_id)
      .eq('day_of_week', day_of_week)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  }

  async deleteDay(user_id: string, day_of_week: string): Promise<void> {
    const { error } = await supabase
      .from('user_schedules')
      .delete()
      .eq('user_id', user_id)
      .eq('day_of_week', day_of_week);
    if (error) throw new Error(error.message);
  }
} 