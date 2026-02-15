import { Router } from 'express';
import { queryOne } from '../db';
import { Stats } from '../types';

const router = Router();

/**
 * Получить общую статистику
 * GET /api/stats
 */
router.get('/', (_req, res) => {
  try {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM nodes) as total_nodes,
        (SELECT COUNT(*) FROM edges) as total_edges,
        (SELECT COUNT(*) FROM sources) as total_files,
        (SELECT COUNT(DISTINCT package) FROM nodes WHERE package IS NOT NULL) as total_packages
    `;
    
    const stats = queryOne<Stats>(sql);
    
    if (!stats) {
      return res.status(500).json({ error: 'Не удалось получить статистику' });
    }
    
    return res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    return res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

export default router;

