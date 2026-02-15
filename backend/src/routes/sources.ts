import { Router } from 'express';
import { queryOne } from '../db';

const router = Router();

/**
 * Получить исходный код файла
 * GET /api/sources/:file
 * 
 * Параметр :file должен быть закодирован (encodeURIComponent)
 */
router.get('/:file', (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.file);
    
    const sql = 'SELECT content, package FROM sources WHERE file = ?';
    const result = queryOne<{ content: string; package: string | null }>(sql, [filePath]);
    
    if (!result) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    return res.json({
      file: filePath,
      content: result.content,
      package: result.package
    });
  } catch (error) {
    console.error('Ошибка получения исходного кода:', error);
    return res.status(500).json({ error: 'Ошибка при получении исходного кода' });
  }
});

export default router;

