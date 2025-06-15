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

  signOut = async (req: Request, res: Response) => {
    // JWT é stateless, então apenas retorna sucesso
    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso!'
    });
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
} 