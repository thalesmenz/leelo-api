import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class UserController {
  getUserById = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      
      const { data: user, error } = await supabase
        .from('users_accounts')
        .select('id, name, email, is_subuser, parent_id')
        .eq('id', user_id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar usuário.'
      });
    }
  };
} 