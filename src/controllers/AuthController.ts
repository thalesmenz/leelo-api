import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { SignUpDTO, SignInDTO } from '../types/auth';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signUp = async (req: Request, res: Response) => {
    try {
      const userData: SignUpDTO = req.body;
      const result = await this.authService.signUp(userData);
      
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso!',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao registrar usuário.'
      });
    }
  };

  signIn = async (req: Request, res: Response) => {
    try {
      const credentials: SignInDTO = req.body;
      const result = await this.authService.signIn(credentials);
      
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Erro ao fazer login.'
      });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório.'
        });
      }

      const result = await this.authService.refreshToken(refresh_token);
      
      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso!',
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Erro ao renovar token.'
      });
    }
  };

  signOut = async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      
      if (refresh_token) {
        await this.authService.signOut(refresh_token);
      }
      
      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso!'
      });
    } catch (error: any) {
      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso!'
      });
    }
  };

  signOutAll = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido.'
        });
      }

      const token = authHeader.split(' ')[1];
      const user = await this.authService.getCurrentUser(token);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido.'
        });
      }

      await this.authService.signOutAll(user.id);
      
      res.status(200).json({
        success: true,
        message: 'Logout de todos os dispositivos realizado com sucesso!'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao fazer logout de todos os dispositivos.'
      });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido.'
        });
      }
      const token = authHeader.split(' ')[1];
      const user = await this.authService.getCurrentUser(token);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Usuário encontrado com sucesso!',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar usuário.'
      });
    }
  };

  validateToken = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido.'
        });
      }

      const token = authHeader.split(' ')[1];
      const isValid = await this.authService.validateToken(token);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado.'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token válido.'
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }
  };
} 