import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    is_subuser?: boolean;
    parent_id?: string | null;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido.'
      });
    }

    // Valida o token
    const isValid = await authService.validateToken(token);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado.'
      });
    }

    // Busca dados do usuário
    const user = await authService.getCurrentUser(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // Adiciona o usuário ao request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido.'
    });
  }
};

export const requireActiveUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado.'
    });
  }

  // Verifica se o usuário está ativo (se implementar campo status)
  // if (req.user.status === 'inactive') {
  //   return res.status(403).json({
  //     success: false,
  //     message: 'Conta desativada.'
  //   });
  // }

  next();
};

export const requireMainUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado.'
    });
  }

  if (req.user.is_subuser) {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a usuários principais.'
    });
  }

  next();
};



