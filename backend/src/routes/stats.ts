import { Router } from 'express';
import { queryOne } from '../db';
import { Stats } from '../types';

const router = Router();

/**
 * Get overall statistics
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
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
    
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ error: 'Error fetching statistics' });
  }
});

export default router;

