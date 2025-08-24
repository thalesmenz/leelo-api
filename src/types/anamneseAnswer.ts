export interface AnamneseAnswer {
  id: string;
  question_id: string;
  patient_id: string;
  appointment_id?: string;
  answer: string;
  answered_at: string;
}

export interface CreateAnamneseAnswerDTO {
  question_id: string;
  patient_id: string;
  appointment_id?: string;
  answer: string;
}

export interface UpdateAnamneseAnswerDTO {
  question_id?: string;
  patient_id?: string;
  appointment_id?: string;
  answer?: string;
}

export interface AnamneseAnswerFilters {
  question_id?: string;
  patient_id?: string;
  appointment_id?: string;
  answered_at_from?: string;
  answered_at_to?: string;
}

export interface AnamneseAnswerStatistics {
  total_answers: number;
  answers_by_question: Record<string, number>;
  answers_by_patient: Record<string, number>;
  recent_answers: number;
}











