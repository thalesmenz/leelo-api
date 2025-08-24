export interface AnamneseQuestion {
  id: string;
  user_id: string;
  question: string;
  category?: string;
  type: 'text' | 'number' | 'boolean' | 'multiple_choice';
  options?: any; // JSONB para múltipla escolha
  is_required: boolean;
  order?: number;
  created_at: string;
}

export interface CreateAnamneseQuestionDTO {
  user_id: string;
  question: string;
  category?: string;
  type: 'text' | 'number' | 'boolean' | 'multiple_choice';
  options?: any;
  is_required?: boolean;
  order?: number;
}

export interface UpdateAnamneseQuestionDTO {
  question?: string;
  category?: string;
  type?: 'text' | 'number' | 'boolean' | 'multiple_choice';
  options?: any;
  is_required?: boolean;
  order?: number;
}

export interface AnamneseQuestionFilters {
  user_id?: string;
  category?: string;
  type?: 'text' | 'number' | 'boolean' | 'multiple_choice';
  is_required?: boolean;
}

