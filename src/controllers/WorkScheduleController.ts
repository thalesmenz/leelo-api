import { Request, Response } from 'express';
import { WorkScheduleService } from '../services/WorkScheduleService';

const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export class WorkScheduleController {
  private service = new WorkScheduleService();

  async getAll(req: Request, res: Response) {
    try {
      const { user_id } = req.params;
      const schedules = await this.service.getByUser(user_id);
      res.json(schedules);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar horários' });
    }
  }

  async getDay(req: Request, res: Response) {
    try {
      const { user_id, weekday, day_of_week } = req.params;
      // Permite buscar tanto por weekday (número) quanto por day_of_week (string)
      let dayKey = day_of_week;
      if (!dayKey && typeof weekday !== 'undefined') {
        dayKey = dayNames[Number(weekday)] ?? '';
      }
      if (!dayKey) return res.status(400).json({ error: 'Dia da semana inválido' });
      const schedule = await this.service.getDay(user_id, dayKey);
      if (!schedule) return res.status(404).json({ error: 'Dia não encontrado' });
      res.json(schedule);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar dia' });
    }
  }

  async upsertMany(req: Request, res: Response) {
    try {
      const { user_id } = req.params;
      const schedules = req.body; // array de dias
      const result = await this.service.upsertMany(user_id, schedules);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao salvar horários' });
    }
  }

  async updateDay(req: Request, res: Response) {
    try {
      const { user_id, weekday, day_of_week } = req.params;
      let dayKey = day_of_week;
      if (!dayKey && typeof weekday !== 'undefined') {
        dayKey = dayNames[Number(weekday)] ?? '';
      }
      if (!dayKey) return res.status(400).json({ error: 'Dia da semana inválido' });
      const data = req.body;
      const updated = await this.service.updateDay(user_id, dayKey, data);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao atualizar dia' });
    }
  }

  async deleteDay(req: Request, res: Response) {
    try {
      const { user_id, weekday, day_of_week } = req.params;
      let dayKey = day_of_week;
      if (!dayKey && typeof weekday !== 'undefined') {
        dayKey = dayNames[Number(weekday)] ?? '';
      }
      if (!dayKey) return res.status(400).json({ error: 'Dia da semana inválido' });
      await this.service.deleteDay(user_id, dayKey);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao remover dia' });
    }
  }
} 