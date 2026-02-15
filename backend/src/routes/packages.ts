import { Router } from 'express';
import { query } from '../db';
import { Package, Node } from '../types';

const router = Router();

/**
 * Получить список всех пакетов
 * GET /api/packages
 */
router.get('/', (_req, res) => {
  try {
    const sql = `
      SELECT package, files, functions, types, loc
      FROM stats_packages
      ORDER BY package
    `;
    
    const packages = query<Package>(sql);
    return res.json(packages);
  } catch (error) {
    console.error('Ошибка получения пакетов:', error);
    return res.status(500).json({ error: 'Ошибка при получении пакетов' });
  }
});

/**
 * Получить все функции пакета
 * GET /api/packages/:name/functions
 */
router.get('/:name/functions', (req, res) => {
  try {
    const packageName = decodeURIComponent(req.params.name);
    
    const sql = `
      SELECT n.id, n.name, n.file, n.line, n.end_line,
        m.cyclomatic_complexity, m.fan_in, m.fan_out, m.loc
      FROM nodes n
      LEFT JOIN metrics m ON m.function_id = n.id
      WHERE n.package = ? AND n.kind = 'function'
      ORDER BY n.name
    `;
    
    const functions = query<Node>(sql, [packageName]);
    return res.json(functions);
  } catch (error) {
    console.error('Ошибка получения функций пакета:', error);
    return res.status(500).json({ error: 'Ошибка при получении функций пакета' });
  }
});

export default router;

