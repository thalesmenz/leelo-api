export interface WorkSchedule {
  id: string;
  user_id: string;
  day_of_week: string; // 'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
  is_active: boolean;
  start_time: string; // '08:00:00'
  end_time: string;   // '18:00:00'
  has_lunch_break: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  created_at: string;
  updated_at: string;
}

export type WorkScheduleUpsert = Omit<WorkSchedule, 'id' | 'created_at' | 'updated_at'>; 