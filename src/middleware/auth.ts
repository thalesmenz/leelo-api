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
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido.'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Formato de token inválido.'
      });
      return;
    }

    // Valida o token
    const isValid = await authService.validateToken(token);
    
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado.'
      });
      return;
    }

    // Busca dados do usuário
    const user = await authService.getCurrentUser(token);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
      return;
    }

    // Adiciona o usuário ao request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido.'
    });
  }
};

export const requireActiveUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado.'
    });
    return;
  }

  // Verifica se o usuário está ativo (se implementar campo status)
  // if (req.user.status === 'inactive') {
  //   res.status(403).json({
  //     success: false,
  //     message: 'Conta desativada.'
  //   });
  //   return;
  // }

  next();
};

export const requireMainUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado.'
    });
    return;
  }

  if (req.user.is_subuser) {
    res.status(403).json({
      success: false,
      message: 'Acesso restrito a usuários principais.'
    });
    return;
  }

  next();
};



