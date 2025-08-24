export interface WorkSchedule {
  id: string;
  user_id: string;
  weekday: number; // 0=Dom, 1=Seg, ..., 6=Sáb
  active: boolean;
  start_time: string; // '08:00'
  end_time: string;   // '18:00'
  has_lunch_break: boolean;
  lunch_start?: string;
  lunch_end?: string;
  slot_interval?: number; // intervalo em minutos para slots (padrão 30)
  created_at: string;
  updated_at: string;
}

export type WorkScheduleUpsert = Omit<WorkSchedule, 'id' | 'created_at' | 'updated_at'>; 