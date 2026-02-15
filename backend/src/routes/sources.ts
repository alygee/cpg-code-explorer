import { Router } from 'express';
import { queryOne } from '../db';

const router = Router();

/**
 * Get source code of a file
 * GET /api/sources/:file
 * 
 * The :file parameter should be encoded (encodeURIComponent)
 */
router.get('/:file', (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.file);
    
    const sql = 'SELECT content, package FROM sources WHERE file = ?';
    const result = queryOne<{ content: string; package: string | null }>(sql, [filePath]);
    
    if (!result) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    return res.json({
      file: filePath,
      content: result.content,
      package: result.package
    });
  } catch (error) {
    console.error('Error fetching source code:', error);
    return res.status(500).json({ error: 'Error fetching source code' });
  }
});

export default router;

